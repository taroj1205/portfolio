import { formatDistanceToNow, format, isToday, isYesterday, parseISO, isWithinInterval, subWeeks } from 'date-fns'
import ja from 'date-fns/locale/ja';


const DateFormatter = ({ date, lang}: { date: string; lang: string }) => {
    let formattedDate;
    const postDate = parseISO(date);
    const locale = lang === 'ja' ? ja : undefined;
    const timeFormat = format(postDate, 'HH:mm');

    if (isToday(postDate)) {
        formattedDate = `${formatDistanceToNow(postDate, { addSuffix: true, locale })}${lang === 'ja' ? 'の' : ' at '}${timeFormat}`;
    } else if (isYesterday(postDate)) {
        formattedDate = lang === 'ja' ? `昨日の${timeFormat}` : `Yesterday at ${timeFormat}`;
    } else if (isWithinInterval(postDate, { start: subWeeks(new Date(), 1), end: new Date() })) {
        formattedDate = `${formatDistanceToNow(postDate, { addSuffix: true, locale })}${lang === 'ja' ? 'の' : ' at '}${timeFormat}`;
    } else {
        formattedDate = format(postDate, 'Pp', { locale });
    }

    return (
        <time dateTime={date} className="mb-1 text-base text-gray-400">
            {formattedDate}
        </time>
    )
}

export default DateFormatter