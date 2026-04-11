import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import CandidateFlowNav from "./CandidateFlowNav";
import { getCandidateShortcuts } from "../../navigation/candidateFlowNav";

describe("CandidateFlowNav", () => {
  it("renders breadcrumb links and active breadcrumb", () => {
    render(
      <MemoryRouter>
        <CandidateFlowNav
          breadcrumbs={[
            { label: "Candidate Dashboard", to: "/dashboard?tab=candidates" },
            { label: "Find Jobs", to: "/find-jobs" },
            { label: "Job Detail", activeTone: "brightSun" },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Candidate Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Find Jobs" })).toBeInTheDocument();
    expect(screen.getByText("Job Detail")).toBeInTheDocument();
  });

  it("uses callback shortcut as button and keeps others as links", () => {
    const onFindJobs = vi.fn();
    const shortcuts = getCandidateShortcuts(["findJobs", "jobHistory", "swipe"]);

    render(
      <MemoryRouter>
        <CandidateFlowNav shortcuts={shortcuts} onShortcutClick={{ findJobs: onFindJobs }} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Find Jobs" }));

    expect(onFindJobs).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Job History" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Swipe Mode" })).toBeInTheDocument();
  });

  it("applies breadcrumbsClassName and shortcutsClassName overrides", () => {
    const shortcuts = getCandidateShortcuts(["dashboard", "findJobs"]);

    const { container } = render(
      <MemoryRouter>
        <CandidateFlowNav
          breadcrumbs={[
            { label: "Candidate Dashboard", to: "/dashboard?tab=candidates" },
            { label: "Find Jobs", activeTone: "cyan" },
          ]}
          shortcuts={shortcuts}
          breadcrumbsClassName="test-breadcrumbs"
          shortcutsClassName="test-shortcuts"
        />
      </MemoryRouter>,
    );

    expect(container.querySelector(".test-breadcrumbs")).toBeInTheDocument();
    expect(container.querySelector(".test-shortcuts")).toBeInTheDocument();
  });
});
