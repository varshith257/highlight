import { DEFAULT_PAGE_SIZE } from '@components/Pagination/Pagination'
import {
	GetEnhancedUserDetailsDocument,
	GetEventChunksDocument,
	GetEventChunkUrlDocument,
	GetSessionDocument,
	GetSessionIntervalsDocument,
	GetSessionPayloadDocument,
	GetSessionsClickhouseDocument,
	GetSessionsHistogramClickhouseDocument,
	GetWebVitalsDocument,
} from '@graph/hooks'
import { ClickhouseQuery, OpenSearchCalendarInterval } from '@graph/schemas'
import { LoadingError } from '@pages/Player/ResourcesContext/ResourcesContext'
import { indexedDBFetch, IndexedDBLink, isIndexedDBEnabled } from '@util/db'
import { client } from '@util/graph'
import log from '@util/log'
import { useParams } from '@util/react-router/useParams'
import { roundFeedDate } from '@util/time'
import { H } from 'highlight.run'
import moment from 'moment'
import { useEffect, useRef } from 'react'

import {
	GetSessionsClickhouseQuery,
	GetSessionsClickhouseQueryVariables,
	GetSessionsHistogramClickhouseQueryVariables,
} from '@/graph/generated/operations'

const CONCURRENT_SESSION_PRELOADS = 1
// Max brotlied resource file allowed. Note that a brotli file with some binary data
// has a compression ratio of >5x, so unbrotlied this file will take up much more memory.
const RESOURCE_FILE_SIZE_LIMIT_BYTES = 64 * 1024 * 1024

export const usePreloadSessions = function ({
	query,
}: {
	page: number
	query: ClickhouseQuery
}) {
	const { project_id } = useParams<{
		project_id: string
	}>()
	const endDate = useRef<moment.Moment>(roundFeedDate(null))
	const preloadedPages = useRef<Set<number>>(new Set<number>())

	// only load the first page
	// const pageToLoad = page ?? 1
	const pageToLoad = 1

	useEffect(() => {
		;(async () => {
			if (
				!isIndexedDBEnabled() ||
				preloadedPages.current.has(pageToLoad)
			) {
				return false
			}
			if (!query) {
				return false
			}

			// disable preloading for this project due to larger session / network payloads
			if (project_id === '5403') {
				return false
			}

			log('preload.ts', 'sessions query', {
				query,
			})
			client.query({
				query: GetSessionsHistogramClickhouseDocument,
				variables: {
					query,
					project_id,
					histogram_options: {
						bounds: {
							start_date: endDate.current
								.clone()
								.subtract(30, 'days')
								.format(),
							end_date: endDate.current.format(),
						},
						bucket_size: {
							calendar_interval: OpenSearchCalendarInterval.Day,
							multiple: 1,
						},
						time_zone:
							Intl.DateTimeFormat().resolvedOptions().timeZone ??
							'UTC',
					},
				} as GetSessionsHistogramClickhouseQueryVariables,
			})
			const {
				data: sessions,
			}: { data: GetSessionsClickhouseQuery | undefined } =
				await client.query({
					query: GetSessionsClickhouseDocument,
					variables: {
						query,
						count: DEFAULT_PAGE_SIZE,
						page: pageToLoad,
						project_id,
						sort_desc: true,
					} as GetSessionsClickhouseQueryVariables,
				})
			if (!sessions?.sessions_clickhouse.sessions.length) return false
			preloadedPages.current.add(pageToLoad)

			const promises: Promise<void>[] = []
			for (const _s of sessions?.sessions_clickhouse.sessions || []) {
				promises.push(loadSession(_s.secure_id))
				if (promises.length === CONCURRENT_SESSION_PRELOADS) {
					await Promise.all(promises)
					promises.length = 0
				}
			}
			await Promise.all(promises)
		})()
	}, [pageToLoad, project_id, query])
}

export const checkResourceLimit = async function (resources_url: string) {
	const r = await fetch(resources_url, {
		method: 'HEAD',
	})
	const fileSize = Number(r.headers.get('Content-Length'))
	if (fileSize > RESOURCE_FILE_SIZE_LIMIT_BYTES) {
		return {
			error: LoadingError.NetworkResourcesTooLarge,
			fileSize: fileSize,
			sizeLimit: RESOURCE_FILE_SIZE_LIMIT_BYTES,
		}
	}
	return undefined
}

export const loadSession = async function (secureID: string) {
	if (
		await IndexedDBLink.has('GetSession', {
			secure_id: secureID,
		})
	) {
		log('preload.ts', `skipping loaded session ${secureID}`)
		return
	}
	const start = window.performance.now()
	log('preload.ts', `preloading session ${secureID}`)
	try {
		const session = await client.query({
			query: GetSessionDocument,
			variables: {
				secure_id: secureID,
			},
		})
		const sess = session?.data?.session
		if (!sess) return
		if (sess.resources_url) {
			const limit = await checkResourceLimit(sess.resources_url)
			if (!limit) {
				for await (const _ of indexedDBFetch(sess.resources_url)) {
				}
			}
		}
		if (sess.timeline_indicators_url) {
			const limit = await checkResourceLimit(sess.timeline_indicators_url)
			if (!limit) {
				for await (const _ of indexedDBFetch(
					sess.timeline_indicators_url,
				)) {
				}
			}
		}
		if (sess.direct_download_url) {
			for await (const _ of indexedDBFetch(sess.direct_download_url)) {
			}
		}
		await client.query({
			query: GetSessionIntervalsDocument,
			variables: {
				session_secure_id: secureID,
			},
		})
		await client.query({
			query: GetEventChunksDocument,
			variables: {
				secure_id: secureID,
			},
		})
		await client.query({
			query: GetSessionPayloadDocument,
			variables: {
				session_secure_id: secureID,
				skip_events: true,
			},
		})
		await client.query({
			query: GetEnhancedUserDetailsDocument,
			variables: {
				session_secure_id: secureID,
			},
		})
		await client.query({
			query: GetWebVitalsDocument,
			variables: {
				session_secure_id: secureID,
			},
		})
		const response = await client.query({
			query: GetEventChunkUrlDocument,
			variables: {
				secure_id: secureID,
				index: 0,
			},
		})
		await indexedDBFetch(response.data.event_chunk_url)
		const preloadTime = window.performance.now() - start
		log(
			'preload.ts',
			`preloaded session ${secureID} in ${preloadTime / 1000} s.`,
		)
		H.metrics([
			{
				name: 'preload-session-ms',
				value: preloadTime,
				tags: [
					{
						name: 'SecureID',
						value: secureID,
					},
				],
			},
		])
	} catch (e: any) {
		log('preload.ts', `failed to preload session ${secureID}`)
	}
}
