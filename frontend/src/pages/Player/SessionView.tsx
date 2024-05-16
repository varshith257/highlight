import 'rc-slider/assets/index.css'

import ElevatedCard from '@components/ElevatedCard/ElevatedCard'
import LoadingBox from '@components/LoadingBox'
import { useIsSessionPendingQuery } from '@graph/hooks'
import { Session } from '@graph/schemas'
import { Box, Callout, Text } from '@highlight-run/ui/components'
import { useWindowSize } from '@hooks/useWindowSize'
import { CompleteSetup } from '@pages/Player/components/CompleteSetup/CompleteSetup'
import NoActiveSessionCard from '@pages/Player/components/NoActiveSessionCard/NoActiveSessionCard'
import {
	RightPanelView,
	usePlayerUIContext,
} from '@pages/Player/context/PlayerUIContext'
import PlayerCommentCanvas, {
	Coordinates2D,
} from '@pages/Player/PlayerCommentCanvas/PlayerCommentCanvas'
import { SessionViewability } from '@pages/Player/PlayerHook/PlayerState'
import usePlayerConfiguration from '@pages/Player/PlayerHook/utils/usePlayerConfiguration'
import {
	ReplayerState,
	useReplayerContext,
} from '@pages/Player/ReplayerContext'
import RightPlayerPanel from '@pages/Player/RightPlayerPanel/RightPlayerPanel'
import SessionLevelBarV2 from '@pages/Player/SessionLevelBar/SessionLevelBarV2'
import { Toolbar } from '@pages/Player/Toolbar/Toolbar'
import { useApplicationContext } from '@routers/AppRouter/context/ApplicationContext'
import clsx from 'clsx'
import Lottie from 'lottie-react'
import React, { RefObject, useEffect, useMemo, useRef, useState } from 'react'

import { useSearchContext } from '@/components/Search/SearchContext'
import { useNumericProjectId } from '@/hooks/useProjectId'
import { NetworkResourcePanel } from '@/pages/Player/RightPlayerPanel/components/NetworkResourcePanel/NetworkResourcePanel'
import DevToolsWindowV2 from '@/pages/Player/Toolbar/DevToolsWindowV2/DevToolsWindowV2'
import { NewCommentModal } from '@/pages/Player/Toolbar/NewCommentModal/NewCommentModal'
import { useResizePlayer } from '@/pages/Player/utils/utils'
import { useSessionParams } from '@/pages/Sessions/utils'
import { useIntegratedLocalStorage } from '@/util/integrated'

import WaitingAnimation from '../../lottie/waiting.json'
import * as style from './styles.css'

type SessionViewProps = {
	showLeftPanel: boolean
	leftPanelWidth: number
	playerRef: RefObject<HTMLDivElement>
}

export const SessionView: React.FC<SessionViewProps> = ({
	showLeftPanel,
	leftPanelWidth,
	playerRef,
}) => {
	const { sessionSecureId } = useSessionParams()
	const { width } = useWindowSize()

	const {
		setSessionResults,
		state: replayerState,
		sessionViewability,
		session,
		isLoadingEvents,
		setScale,
		replayer,
		isPlayerReady,
		currentUrl,
		time,
	} = useReplayerContext()
	const { totalCount, results } = useSearchContext()

	const [commentModalPosition, setCommentModalPosition] = useState<
		Coordinates2D | undefined
	>(undefined)
	const [commentPosition, setCommentPosition] = useState<
		Coordinates2D | undefined
	>(undefined)

	const showSession =
		sessionViewability === SessionViewability.VIEWABLE && !!session

	const { showRightPanel: showRightPanelPreference } =
		usePlayerConfiguration()
	const { rightPanelView } = usePlayerUIContext()
	const showRightPanel =
		showRightPanelPreference || rightPanelView === RightPanelView.Comments

	const playerWrapperRef = useRef<HTMLDivElement>(null)

	const { resizeListener, centerColumnResizeListener, controllerWidth } =
		useResizePlayer(replayer, playerWrapperRef, setScale)

	const playerFiller = useMemo(() => {
		const playerHeight =
			playerWrapperRef.current?.getBoundingClientRect().height
		const height = ((playerHeight ?? 0) * 3) / 5
		return <LoadingBox width={controllerWidth} height={height} />
	}, [controllerWidth])

	const replayerWrapperBbox = replayer?.wrapper.getBoundingClientRect()

	const { isPlayerFullscreen } = usePlayerUIContext()

	useEffect(() => {
		setSessionResults({
			totalCount,
			sessions: results,
		})
	}, [setSessionResults, totalCount, results])

	if (!showSession && replayerState !== ReplayerState.Loading) {
		return (
			<SessionFiller
				sessionViewability={sessionViewability}
				session={session}
			/>
		)
	}

	return (
		<Box
			background="raised"
			height="full"
			p="8"
			width="full"
			display="flex"
		>
			<div className={style.rrwebPlayerSection}>
				<Box
					display="flex"
					flexDirection="column"
					width="full"
					height="full"
				>
					{!isPlayerFullscreen && (
						<SessionLevelBarV2
							width={
								width -
								(showLeftPanel ? leftPanelWidth : 0) -
								3 * style.PLAYER_PADDING
							}
						/>
					)}
					<Box
						height="full"
						cssClass={[
							style.playerBody,
							{
								[style.withRightPanel]: showRightPanel,
							},
						]}
					>
						<div className={style.playerCenterColumn}>
							{centerColumnResizeListener}
							<div className={style.playerWrapperV2}>
								<div
									className={clsx(style.rrwebPlayerWrapper, {
										[style.blurBackground]:
											isLoadingEvents && isPlayerReady,
									})}
									ref={playerWrapperRef}
								>
									{resizeListener}
									{replayerState ===
										ReplayerState.SessionRecordingStopped && (
										<Box
											display="flex"
											alignItems="center"
											flexDirection="column"
											justifyContent="center"
											position="absolute"
											style={{
												height: replayerWrapperBbox?.height,
												width: replayerWrapperBbox?.width,
												zIndex: 2,
											}}
										>
											<ManualStopCard />
										</Box>
									)}
									<div
										style={{
											visibility: isPlayerReady
												? 'visible'
												: 'hidden',
										}}
										className="highlight-block"
										id="player"
										ref={playerRef}
									/>
									<PlayerCommentCanvas
										setModalPosition={
											setCommentModalPosition
										}
										modalPosition={commentModalPosition}
										setCommentPosition={setCommentPosition}
									/>
									{!isPlayerReady && playerFiller}
								</div>
								<Toolbar width={controllerWidth} />
							</div>
							<DevToolsWindowV2 width={controllerWidth} />
						</div>
						{!isPlayerFullscreen && <RightPlayerPanel />}
						<NetworkResourcePanel />
					</Box>
				</Box>
			</div>
			<NewCommentModal
				commentModalPosition={commentModalPosition}
				commentPosition={commentPosition}
				commentTime={time}
				session={session}
				session_secure_id={sessionSecureId}
				onCancel={() => {
					setCommentModalPosition(undefined)
				}}
				currentUrl={currentUrl}
			/>
		</Box>
	)
}

export const ManualStopCard: React.FC = () => {
	return (
		<ElevatedCard title="Session recording manually stopped">
			<p>
				<a
					href="https://docs.highlight.run/api/hstop"
					target="_blank"
					rel="noreferrer"
				>
					<code>H.stop()</code>
				</a>{' '}
				was called during the session. Calling this method stops the
				session recording. If you expect the recording to continue
				please check where you are calling{' '}
				<a
					href="https://docs.highlight.run/api/hstop"
					target="_blank"
					rel="noreferrer"
				>
					<code>H.stop()</code>
				</a>
				.
			</p>
		</ElevatedCard>
	)
}

export const SessionFiller: React.FC<{
	sessionViewability: SessionViewability
	session: Session | undefined
}> = ({ session, sessionViewability }) => {
	const { currentWorkspace } = useApplicationContext()
	const { projectId } = useNumericProjectId()
	const [{ integrated }] = useIntegratedLocalStorage(projectId!, 'client')
	const sessionSecureId = session?.secure_id

	const { data: isSessionPendingData } = useIsSessionPendingQuery({
		variables: {
			session_secure_id: sessionSecureId!,
		},
		skip:
			!sessionSecureId || sessionViewability !== SessionViewability.ERROR,
	})

	switch (sessionViewability) {
		case SessionViewability.ERROR:
			if (isSessionPendingData?.isSessionPending) {
				return (
					<Box m="auto" style={{ maxWidth: 300 }}>
						<Callout
							kind="info"
							title="This session is on the way!"
						>
							<Box pb="6">
								<Text>
									We are processing the data and will show the
									recording here soon. Please come back in a
									minute.
								</Text>
							</Box>
						</Callout>
					</Box>
				)
			} else {
				let reasonText: React.ReactNode
				switch (session?.excluded_reason) {
					case 'BillingQuotaExceeded':
						reasonText = (
							<>
								This session was recorded after your billing
								limit was reached. You can update your billing
								limits{' '}
								<a
									href={`/w/${currentWorkspace?.id}/current-plan`}
								>
									here
								</a>
								.
							</>
						)
						break
					case 'RetentionPeriodExceeded':
						reasonText = (
							<>
								This session is older than your plan's retention
								date. You can update your plan's retention
								settings{' '}
								<a
									href={`/w/${currentWorkspace?.id}/current-plan`}
								>
									here
								</a>
								.
							</>
						)
						break
					default:
						reasonText =
							'This session does not exist or has not been made public.'
						break
				}
				return (
					<Box m="auto" style={{ maxWidth: 300 }}>
						<Callout kind="info" title="Can't load session">
							<Box pb="6">
								<Text>{reasonText}</Text>
							</Box>
						</Callout>
					</Box>
				)
			}
		case SessionViewability.EMPTY_SESSION:
			return (
				<ElevatedCard
					title="Session isn't ready to view yet 😔"
					animation={<Lottie animationData={WaitingAnimation} />}
					className={style.emptySessionCard}
				>
					<p>
						We need more time to process this session. If this looks
						like a bug, please reach out to us!
					</p>
				</ElevatedCard>
			)
		default:
			return (
				<div className={style.playerContainer}>
					<div className={style.rrwebPlayerSection}>
						<Box
							display="flex"
							flexDirection="column"
							width="full"
							height="full"
						>
							<SessionLevelBarV2 width="100%" />
							<Box
								width="full"
								height="full"
								display="flex"
								justifyContent="center"
								borderTop="secondary"
							>
								{integrated ? (
									<NoActiveSessionCard />
								) : (
									<CompleteSetup />
								)}
							</Box>
						</Box>
					</div>
				</div>
			)
	}
}
