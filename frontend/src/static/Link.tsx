import * as React from 'react'

function SvgLink(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			width="1em"
			height="1em"
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<g clipPath="url(#link_svg__clip0)">
				<path
					d="M15.075 10.6L12.95 8.475c-1.075-1.075-2.8-1.2-4-.325l-1.2-1.2c.325-.525.525-1.125.525-1.725 0-.875-.325-1.675-.925-2.25l-2-2.05c-1.2-1.2-3.2-1.2-4.4 0A2.98 2.98 0 00.05 3.1c0 .875.325 1.6.925 2.2l2.05 2.125c.6.6 1.4.925 2.2.925.525 0 1.125-.125 1.6-.475L8.1 9.15c-.275.475-.475 1-.475 1.6 0 .875.325 1.6.925 2.2l2.05 2.125c.6.6 1.4.925 2.2.925.8 0 1.6-.325 2.2-.925.6-.6.925-1.325.925-2.2.075-.875-.25-1.675-.85-2.275zm-11.1-4.125L1.925 4.35A1.839 1.839 0 011.4 3.075c0-.475.2-.925.525-1.275.325-.35.8-.525 1.275-.525.475 0 .925.2 1.275.525L6.6 3.925c.325.325.525.8.525 1.275 0 .275-.075.525-.2.8l-.6-.6c-.275-.275-.675-.275-.925 0-.275.275-.275.675 0 .925l.525.525c-.7.225-1.425.1-1.95-.375zm10.175 7.6c-.725.725-1.875.725-2.525 0L9.5 11.95a1.839 1.839 0 01-.525-1.275c0-.2.075-.4.125-.6l.525.525c.125.125.325.2.475.2.2 0 .325-.075.475-.2.275-.275.275-.675 0-.925l-.525-.6c.275-.125.525-.2.8-.2.475 0 .925.2 1.275.525l2.125 2.125c.325.325.525.8.525 1.275-.1.475-.3.95-.625 1.275z"
					fill="current"
				/>
			</g>
			<defs>
				<clipPath id="link_svg__clip0">
					<path fill="#fff" d="M0 0h16v16H0z" />
				</clipPath>
			</defs>
		</svg>
	)
}

export default SvgLink
