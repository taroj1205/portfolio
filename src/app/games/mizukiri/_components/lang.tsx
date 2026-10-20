import { createContext, useContext } from "react";

import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";

export const LangContext = createContext<Lang>("ja");

export const useLang = () => useContext(LangContext);

export const useCopy = () => copy[useLang()];
