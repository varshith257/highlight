import React, { useContext } from 'react';
import { ReactComponent as Banner } from '../../static/banner.svg';
import { ReactComponent as Hamburger } from '../../static/hamburger.svg';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { UserDropdown } from './UserDropdown/UserDropdown';

import styles from './Header.module.scss';
import { DemoContext } from '../../DemoContext';
import { SidebarContext } from '../Sidebar/SidebarContext';
import classNames from 'classnames/bind';
import { Duration } from '../../util/time';
import { HighlightLogo } from '../HighlightLogo/HighlightLogo';
import { CommandBar } from './CommandBar/CommandBar';

type HeaderProps = {
    trialTimeRemaining?: Duration;
};

export const Header: React.FunctionComponent<HeaderProps> = ({ ...props }) => {
    const { organization_id } = useParams<{ organization_id: string }>();
    const { demo } = useContext(DemoContext);
    const { setOpenSidebar, openSidebar } = useContext(SidebarContext);
    const { trialTimeRemaining } = props;

    return (
        <>
            <CommandBar />
            <div className={styles.header}>
                {process.env.REACT_APP_ONPREM ? (
                    <OnPremiseBanner />
                ) : trialTimeRemaining ? (
                    <TrialBanner timeRemaining={trialTimeRemaining} />
                ) : (
                    <></>
                )}
                <div className={styles.headerContent}>
                    <div className={styles.logoWrapper}>
                        <Hamburger
                            className={styles.hamburger}
                            onClick={() => {
                                setOpenSidebar(!openSidebar);
                            }}
                            style={{
                                transform: openSidebar
                                    ? 'rotate(-180deg)'
                                    : 'rotate(0deg)',
                            }}
                        />
                        <Link
                            className={styles.homeLink}
                            to={demo ? '/' : `/${organization_id}/sessions`}
                        >
                            <HighlightLogo />
                        </Link>
                    </div>
                    <div className={styles.rightHeader}>
                        <UserDropdown />
                    </div>
                </div>
            </div>
        </>
    );
};

const TrialBanner = ({ timeRemaining }: { timeRemaining: Duration }) => {
    const { organization_id } = useParams<{ organization_id: string }>();
    return (
        <div className={styles.trialWrapper}>
            <Banner className={styles.bannerSvg} />
            <div className={classNames(styles.trialTimeText)}>
                {timeRemaining.days}&nbsp;day(s) left in your trial. Pick a plan{' '}
                <Link
                    className={styles.trialLink}
                    to={`/${organization_id}/billing`}
                >
                    here!
                </Link>
            </div>
        </div>
    );
};

const OnPremiseBanner = () => {
    return (
        <div
            className={styles.trialWrapper}
            style={{ backgroundColor: 'black' }}
        >
            <Banner className={styles.bannerSvg} style={{ fill: 'black' }} />
            <div className={classNames(styles.trialTimeText)}>
                Runnning Highlight On-premise{' '}
                {`v${process.env.REACT_APP_COMMIT_SHA}`}
            </div>
        </div>
    );
};
