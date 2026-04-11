import { Link } from "react-router";
import {
  CANDIDATE_FLOW_UI,
  getActiveBreadcrumbClass,
  getShortcutToneClass,
  type CandidateShortcut,
  type CandidateShortcutKey,
} from "../../navigation/candidateFlowNav";

type BreadcrumbTone = "cyan" | "emerald" | "brightSun";

export interface CandidateBreadcrumbItem {
  label: string;
  to?: string;
  activeTone?: BreadcrumbTone;
}

interface CandidateFlowNavProps {
  breadcrumbs?: CandidateBreadcrumbItem[];
  shortcuts?: CandidateShortcut[];
  onShortcutClick?: Partial<Record<CandidateShortcutKey, () => void>>;
  breadcrumbsClassName?: string;
  shortcutsClassName?: string;
}

export default function CandidateFlowNav({
  breadcrumbs,
  shortcuts,
  onShortcutClick,
  breadcrumbsClassName,
  shortcutsClassName,
}: CandidateFlowNavProps) {
  return (
    <>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className={`flex flex-wrap items-center gap-2 text-xs ${breadcrumbsClassName ?? ""}`.trim()}>
          {breadcrumbs.map((item, index) => (
            <div key={`${item.label}-${index}`} className="contents">
              {item.activeTone ? (
                <span className={getActiveBreadcrumbClass(item.activeTone)}>{item.label}</span>
              ) : item.to ? (
                <Link to={item.to} className={CANDIDATE_FLOW_UI.breadcrumbLink}>
                  {item.label}
                </Link>
              ) : (
                <span className={CANDIDATE_FLOW_UI.breadcrumbLink}>{item.label}</span>
              )}
              {index < breadcrumbs.length - 1 && <span className={CANDIDATE_FLOW_UI.breadcrumbSeparator}>/</span>}
            </div>
          ))}
        </div>
      )}

      {shortcuts && shortcuts.length > 0 && (
        <div className={`${CANDIDATE_FLOW_UI.shortcutContainer} ${shortcutsClassName ?? ""}`.trim()}>
          <span className={CANDIDATE_FLOW_UI.shortcutLabel}>Shortcuts:</span>
          {shortcuts.map((item) => {
            const onClick = onShortcutClick?.[item.key];
            if (onClick) {
              return (
                <button key={item.key} onClick={onClick} className={getShortcutToneClass(item.tone)}>
                  {item.label}
                </button>
              );
            }

            return (
              <Link key={item.key} to={item.to} className={getShortcutToneClass(item.tone)}>
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
