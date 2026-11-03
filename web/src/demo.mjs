export const demoWorkspace = {
  schemaVersion: 1,
  projects: [
    {
      id: "aurora",
      title: "Aurora Workspace",
      description: "Synthetic example showing how a project's milestones, decisions, and notes appear at different zoom levels.",
      events: [
        { id:"a1",date:"2026-01-14",type:"milestone",title:"Project created",summary:"Defined the problem and documented an initial vision.",sourceRefs:["example:project-brief"] },
        { id:"a2",date:"2026-02-03",type:"decision",title:"Choose local-first storage",summary:"Keep a path to offline use, explicit exports, and user control.",sourceRefs:["example:decision-001"] },
        { id:"a3",date:"2026-03-08",type:"note",title:"Early prototype reviewed",summary:"Feedback requested faster project navigation and clearer historical context.",sourceRefs:["example:review-008"] },
        { id:"a4",date:"2026-04-19",type:"blocker",title:"Import format inconsistent",summary:"Multiple source formats lacked stable event identifiers.",sourceRefs:["example:issue-014"] },
        { id:"a5",date:"2026-05-22",type:"milestone",title:"Timeline prototype completed",summary:"First usable timeline with milestone and decision zoom.",sourceRefs:["example:release-0.1"] }
      ]
    },
    {
      id:"northstar",
      title:"Northstar Notes",
      description:"Second synthetic project demonstrating project switching and context isolation.",
      events:[
        {id:"n1",date:"2025-08-05",type:"milestone",title:"Research started",summary:"Collected requirements and competing solutions.",sourceRefs:["example:research"]},
        {id:"n2",date:"2025-10-17",type:"decision",title:"Prefer simple exports",summary:"Selected human-readable plain text as the first portability format.",sourceRefs:["example:decision-004"]},
        {id:"n3",date:"2026-01-10",type:"milestone",title:"First handoff exercise",summary:"Practiced resuming a project from a concise history package.",sourceRefs:["example:test-003"]}
      ]
    }
  ]
};
