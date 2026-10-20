import { createContext, useContext } from "react";

import { copy } from "../_lib/copy";
import type { Lang } from "../_lib/i18n";

export const LangContext = createContext<Lang>("ja");

export const useLang = () => useContext(LangContext);

export const useCopy = () => copy[useLang()];
