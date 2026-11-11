/* The scoring sheets are deliberately NOT loaded here: they cancel the hover
   lift of .mk-card, and the three doors are exactly the tiles that must lift. */
import "../../shell/styles/markets.css";
import { mountPage } from "../../shell/mountPage";
import { MoliyaPage } from "./MoliyaPage";

mountPage(<MoliyaPage />);
