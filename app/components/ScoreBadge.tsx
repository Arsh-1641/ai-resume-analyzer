interface ScoreBadgeProps {
	score: number;
}

export default function ScoreBadge({ score }: ScoreBadgeProps) {
	const badge =
		score > 69
			? { background: "bg-badge-green", text: "text-green-600", label: "Strong" }
			: score > 49
				? { background: "bg-badge-yellow", text: "text-yellow-600", label: "Good Start" }
				: { background: "bg-badge-red", text: "text-red-600", label: "Needs Work" };

	return (
		<div className={`inline-flex rounded-full px-3 py-1 ${badge.background}`}>
			<p className={`text-sm font-medium ${badge.text}`}>{badge.label}</p>
		</div>
	);
}
