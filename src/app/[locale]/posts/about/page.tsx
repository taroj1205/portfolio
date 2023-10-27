import {redirect} from "@/lib/next-intl";

export default async function Home() {
    redirect('/about');
}