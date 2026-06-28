// Resume Template — Typst
// 输入: resume.yaml (通过 build-resume.js 读取)
// 输出: public/assets/resume.pdf
//
// 最小可运行模板草案
// 第一阶段不要求编译完美，只定义结构

#set document(title: "Resume")
#set page(paper: "a4", margin: (x: 2cm, y: 2cm))
#set text(font: "Source Han Sans", size: 10pt)

// 数据占位 — 实际使用时由 build-resume.js 注入
#let resume-data = yaml("resume.yaml")

// 基本信息
#let basics = resume-data.basics

#align(center)[
  #text(size: 18pt, weight: "bold")[#basics.name]
  #v(4pt)
  #text(size: 11pt, fill: gray)[#basics.label]
  #v(8pt)
  #text(size: 9pt)[
    #basics.email | #basics.phone | #basics.location
  ]
]

#v(12pt)

// 教育经历
== 教育经历

#for edu in resume-data.education [
  *#edu.institution* — #edu.area \
  #edu.studyType | #edu.startDate — #edu.endDate
  #v(8pt)
]

// 工作经历
== 工作经历

#for exp in resume-data.experience [
  *#exp.company* — #exp.position \
  #exp.startDate — #exp.endDate \
  #exp.summary \
  #for highlight in exp.highlights [
    - #highlight
  ]
  #v(8pt)
]

// 项目经历
== 项目经历

#for project in resume-data.projects [
  *#project.name* \
  #project.description \
  #for highlight in project.highlights [
    - #highlight
  ]
  #v(8pt)
]

// 技能
== 技能

#for skill in resume-data.skills [
  *#skill.name* (#skill.level): #skill.keywords.join(", ")
  #v(4pt)
]
