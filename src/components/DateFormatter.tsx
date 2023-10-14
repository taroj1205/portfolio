import { parseISO, formatDistanceToNow } from 'date-fns'
import { useFormatter } from 'next-intl'

type Props = {
    dateString: string
}

const DateFormatter = ({ dateString }: Props) => {
    const date = parseISO(dateString)
    const formatDate = useFormatter();

    const timePeriod = formatDate.relativeTime(date)
    return <time className="text-slate-400" dateTime={dateString}>{timePeriod}</time>
}

export default DateFormatter