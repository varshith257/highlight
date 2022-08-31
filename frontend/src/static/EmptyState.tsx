import * as React from 'react'

function SvgEmptyState(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			width="1em"
			height="1em"
			viewBox="0 0 279 39"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<ellipse cx={23} cy={23.5} rx={15} ry={14.5} fill="#F1F1F1" />
			<circle cx={16.5} cy={16.5} r={16.5} fill="#E6E6E6" />
			<rect x={78} y={25} width={201} height={14} rx={3} fill="#E6E6E6" />
			<rect x={67} width={177} height={14} rx={3} fill="#F1F1F1" />
		</svg>
	)
}

export default SvgEmptyState
