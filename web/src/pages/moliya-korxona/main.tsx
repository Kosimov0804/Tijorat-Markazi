import "../../shell/styles/moliya.css";
import { mountPage } from "../../shell/mountPage";
import { ScoringApp } from "../moliya-shared/apply/ScoringApp";

/* The track is the ONLY difference between the company and the startup page. */
mountPage(<ScoringApp track="company" />);
