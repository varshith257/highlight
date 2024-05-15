import { Box, Stack } from '@highlight-run/ui/components'
import clsx from 'clsx'
import { stringify } from 'query-string'
import { useRef } from 'react'

import LoadingBox from '@/components/LoadingBox'
import { RelatedSession } from '@/components/RelatedResources/hooks'
import { Panel } from '@/components/RelatedResources/Panel'
import { useNumericProjectId } from '@/hooks/useProjectId'
import { usePlayerUIContext } from '@/pages/Player/context/PlayerUIContext'
import { usePlayer } from '@/pages/Player/PlayerHook/PlayerHook'
import { SessionViewability } from '@/pages/Player/PlayerHook/PlayerState'
import { PlayerSearchParameters } from '@/pages/Player/PlayerHook/utils'
import {
	ReplayerContextProvider,
	ReplayerState,
} from '@/pages/Player/ReplayerContext'
import {
	ResourcesContextProvider,
	useResources,
} from '@/pages/Player/ResourcesContext/ResourcesContext'
import { NetworkResourcePanel } from '@/pages/Player/RightPlayerPanel/components/NetworkResourcePanel/NetworkResourcePanel'
import {
	SessionCurrentUrl,
	SessionViewportMetadata,
} from '@/pages/Player/SessionLevelBar/SessionLevelBarV2'
import SessionShareButtonV2 from '@/pages/Player/SessionShareButton/SessionShareButtonV2'
import { ManualStopCard, SessionFiller } from '@/pages/Player/SessionView'
import * as styles from '@/pages/Player/styles.css'
import DevToolsWindowV2 from '@/pages/Player/Toolbar/DevToolsWindowV2/DevToolsWindowV2'
import { Toolbar } from '@/pages/Player/Toolbar/Toolbar'
import useToolbarItems from '@/pages/Player/Toolbar/ToolbarItems/useToolbarItems'
import { ToolbarItemsContextProvider } from '@/pages/Player/Toolbar/ToolbarItemsContext/ToolbarItemsContext'
import { useResizePlayer } from '@/pages/Player/utils/utils'

export const SessionPanel: React.FC<{ resource: RelatedSession }> = ({
	resource,
}) => {
	const { projectId } = useNumericProjectId()
	const playerContext = usePlayer()
	const {
		session,
		state: replayerState,
		isLoadingEvents,
		isPlayerReady,
		replayer,
		sessionViewability,
		setScale,
		time,
	} = playerContext
	const resourcesContext = useResources(session)
	const toolbarContext = useToolbarItems()
	const playerWrapperRef = useRef<HTMLDivElement>(null)
	const replayerWrapperBbox = replayer?.wrapper.getBoundingClientRect()
	const { playerCenterPanelRef } = usePlayerUIContext()

	const { resizeListener, centerColumnResizeListener, controllerWidth } =
		useResizePlayer(replayer, playerWrapperRef, setScale)

	const path = () => {
		const params = {
			[PlayerSearchParameters.errorId]: resource.errorId,
			[PlayerSearchParameters.log]: resource.log,
			[PlayerSearchParameters.tsAbs]: time,
		}

		const filteredParams = Object.fromEntries(
			Object.entries(params).filter(([_, value]) => value !== undefined),
		)

		const paramsString = stringify(filteredParams)

		return `/${projectId}/sessions/${resource.secureId}?${paramsString}`
	}

	const showSession =
		sessionViewability === SessionViewability.VIEWABLE && !!session

	return (
		<ReplayerContextProvider value={playerContext}>
			<ResourcesContextProvider value={resourcesContext}>
				<ToolbarItemsContextProvider value={toolbarContext}>
					<Panel.Header path={path}>
						<Stack
							justify="space-between"
							align="center"
							flexGrow={1}
							direction="row"
							overflow="hidden"
							gap="4"
						>
							<Stack
								align="center"
								direction="row"
								flexGrow={1}
								overflow="hidden"
							>
								<SessionViewportMetadata />
								<SessionCurrentUrl />
							</Stack>

							<SessionShareButtonV2 />
							<Panel.HeaderDivider />
						</Stack>
					</Panel.Header>

					<Box
						display="flex"
						flexDirection="column"
						width="full"
						height="full"
						id="playerCenterPanel"
						ref={playerCenterPanelRef}
					>
						{showSession ||
						replayerState === ReplayerState.Loading ? (
							<Box height="full" cssClass={styles.playerBody}>
								<div className={styles.playerCenterColumn}>
									{centerColumnResizeListener}
									<Box
										display="flex"
										flexDirection="column"
										flexGrow={1}
									>
										<div
											className={clsx(
												styles.rrwebPlayerWrapper,
												{
													[styles.blurBackground]:
														isLoadingEvents &&
														isPlayerReady,
												},
											)}
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
											/>
											{!isPlayerReady && <LoadingBox />}
										</div>
										<Toolbar width={controllerWidth} />
									</Box>
									<DevToolsWindowV2 width={controllerWidth} />
								</div>
								<NetworkResourcePanel />
							</Box>
						) : (
							<SessionFiller
								sessionViewability={sessionViewability}
								session={session}
							/>
						)}
					</Box>
				</ToolbarItemsContextProvider>
			</ResourcesContextProvider>
		</ReplayerContextProvider>
	)
}
