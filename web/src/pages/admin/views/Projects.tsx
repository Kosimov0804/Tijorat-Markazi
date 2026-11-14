import { asArray, asString, isRecord } from "../../../shell/chat";
import { adminPost } from "../api";
import { Intro, orDash, useLoader } from "../parts";
import { useText } from "../useText";

interface Project {
  company: string;
  title: string;
  body: string;
  amount: string;
  status: string;
  assoc: string;
}

function parseProject(value: unknown): Project {
  const item = isRecord(value) ? value : {};
  return {
    company: asString(item.company),
    title: asString(item.title),
    body: asString(item.body),
    amount: asString(item.amount),
    status: asString(item.status),
    assoc: asString(item.assoc),
  };
}

async function loadProjects(): Promise<Project[]> {
  const answer = await adminPost("/api/admin/projects");
  return asArray(isRecord(answer) ? answer.projects : null).map(parseProject);
}

/** Oversight of every company's investment and startup projects. */
export function Projects() {
  const { tx } = useText();
  const { data: projects } = useLoader(loadProjects, []);

  return (
    <div className="admin-panel">
      <h2>{tx("nav_projects")}</h2>
      <Intro>{tx("pr_intro")}</Intro>
      <div id="prList">
        {projects === null && <p className="ac-label">…</p>}
        {projects?.length === 0 && <p className="ac-label">{tx("pr_empty")}</p>}
        {projects && projects.length > 0 && <ProjectTable projects={projects} />}
      </div>
    </div>
  );
}

function ProjectTable({ projects }: { projects: readonly Project[] }) {
  const { tx } = useText();
  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>{tx("pr_company")}</th>
          <th>{tx("pr_proj")}</th>
          <th>{tx("pr_amount")}</th>
          <th>{tx("pr_status")}</th>
          <th>{tx("pr_assoc")}</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((project, index) => (
          <tr key={index}>
            <td>
              <b>{project.company}</b>
            </td>
            <td>
              {project.title}
              {project.body && (
                <>
                  <br />
                  <span style={{ color: "var(--muted)", fontSize: 12.5 }}>{project.body}</span>
                </>
              )}
            </td>
            <td>{orDash(project.amount)}</td>
            <td>{orDash(project.status)}</td>
            <td>{orDash(project.assoc)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
