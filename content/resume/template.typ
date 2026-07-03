#let resume = yaml("resume.yaml")
#let accent = rgb("#2f6fbd")
#let muted = rgb("#667085")
#let rule = line(length: 100%, stroke: 0.7pt + rgb("#d7e1ef"))

#set document(title: resume.basics.name + " - Resume")
#set page(
  margin: (x: 28pt, y: 28pt),
  paper: "a4",
)
#set text(font: ("Noto Serif CJK SC", "Songti SC", "Times New Roman"), size: 9.2pt, fill: rgb("#172033"))
#set par(justify: true, leading: 0.56em)

#let section(title) = {
  v(8pt)
  text(size: 12pt, weight: "bold", fill: accent)[#title]
  v(2pt)
  line(length: 100%, stroke: 0.8pt + accent)
  v(5pt)
}

#let row(left, body) = {
  grid(
    columns: (72pt, 1fr),
    gutter: 12pt,
    align: (top, top),
    [
      #text(size: 8pt, weight: "bold", fill: muted)[#left]
    ],
    [
      #body
    ],
  )
  v(6pt)
}

#let bullets(items) = {
  list(
    tight: true,
    ..items.map(item => [#item])
  )
}

#grid(
  columns: (1fr, 74pt),
  gutter: 16pt,
  align: (top, top),
  [
    #text(size: 25pt, weight: "bold", fill: rgb("#101828"))[#resume.basics.name]
    #h(6pt)
    #text(size: 11pt, fill: accent, weight: "semibold")[#resume.basics.label]
    #v(5pt)
    #text(size: 8.5pt, fill: muted)[#resume.basics.location · #resume.basics.phone · #resume.basics.email]
    #v(5pt)
    #resume.basics.summary
  ],
  [
    #image(resume.basics.avatar, width: 62pt)
  ],
)
#v(4pt)
#line(length: 100%, stroke: 1.2pt + accent)

#section("教育经历")
#for edu in resume.education {
  row(edu.startDate + " - " + edu.endDate)[
    #text(weight: "bold")[#edu.institution]
    #h(4pt)
    #text(fill: muted)[#edu.studyType · #edu.area]
    #v(2pt)
    #edu.summary
    #bullets(edu.highlights)
  ]
}

#section("工作与组织经历")
#for exp in resume.experience {
  row(exp.startDate + " - " + exp.endDate)[
    #text(weight: "bold")[#exp.company]
    #h(4pt)
    #text(fill: accent)[#exp.position]
    #v(2pt)
    #exp.summary
    #bullets(exp.highlights)
  ]
}

#section("核心项目")
#for project in resume.projects {
  row(project.startDate + " - " + project.endDate)[
    #text(weight: "bold")[#project.name]
    #h(4pt)
    #text(size: 8pt, fill: muted)[#project.type]
    #v(2pt)
    #project.description
    #v(2pt)
    #text(size: 8pt, fill: accent)[#project.keywords.join(" / ")]
    #bullets(project.highlights)
  ]
}

#section("技能与奖项")
#grid(
  columns: (1fr, 1fr),
  gutter: 14pt,
  align: (top, top),
  [
    #for skill in resume.skills [
      #text(weight: "bold", fill: accent)[#skill.name]
      #h(4pt)
      #text(size: 8pt, fill: muted)[#skill.level]
      #v(1pt)
      #text(size: 8.2pt)[#skill.keywords.join(" / ")]
      #v(4pt)
    ]
  ],
  [
    #bullets(resume.achievements)
  ],
)
