// Resume Template — Typst (Moderncv Classic Style Rebuild)
// 输入: resume.yaml (由 build-resume.js 读取并生成)
// 输出: public/assets/resume.pdf

#set document(title: "个人简历")
#set page(
  paper: "a4",
  margin: (x: 1.5cm, y: 1.5cm),
)
// 使用华文细黑或思源黑体，保障中文字体完美导出
#set text(font: ("Source Han Sans", "STHeiti", "SimHei"), size: 9.5pt, fill: rgb("#334155"))
#set par(leading: 0.6em)

// 数据源导入
#let resume-data = yaml("resume.yaml")
#let basics = resume-data.basics

// 预定义现代经典蓝色 (moderncv color)
#let brand-color = rgb("#1d4ed8") // 经典宝蓝色
#let text-dark = rgb("#1e293b")
#let text-light = rgb("#64748b")

// 通用左右分栏布局函数
#let cv-item(left-content, right-content) = {
  grid(
    columns: (22%, 78%),
    column-gutter: 14pt,
    row-gutter: 6pt,
    align(right)[#text(size: 9pt, weight: "bold", fill: brand-color)[#left-content]],
    align(left)[#right-content]
  )
  v(4pt)
}

// 模块分隔线定义 (对标 moderncv classic 横线)
#let cv-section(title) = {
  v(12pt)
  text(size: 12pt, weight: "bold", fill: brand-color)[#title]
  v(-3pt)
  line(length: 100%, stroke: 1.5pt + brand-color)
  v(6pt)
}

// 1. 顶部基础信息与头像区域 (使用 2 栏布局对齐)
#grid(
  columns: (1fr, 64pt),
  column-gutter: 16pt,
  [
    #text(size: 20pt, weight: "bold", fill: brand-color)[#basics.name]
    #h(8pt)
    #text(size: 10.5pt, weight: "medium", fill: text-light)[#basics.label]
    
    #v(6pt)
    #text(size: 8.5pt, fill: text-light)[
      📧 #basics.email #h(8pt) | #h(8pt) 📞 #basics.phone #h(8pt) | #h(8pt) 🌐 #basics.url #h(8pt) | #h(8pt) 📍 #basics.location
    ]
    #v(6pt)
    #text(size: 8.5pt, style: "italic")[#basics.summary]
  ],
  // 右上角头像嵌入
  align(right)[
    #rect(stroke: 0.5pt + rgb("#cbd5e1"), radius: 2pt, inset: 0pt)[
      #image("references/image.jpg", width: 64pt, height: 64pt)
    ]
  ]
)

#v(8pt)

// 2. 教育背景
#cv-section("教育背景")
#for edu in resume-data.education {
  cv-item(
    [#edu.startDate -- #edu.endDate],
    [
      *#edu.institution* #h(12pt) | #h(12pt) #edu.area #h(12pt) | #h(12pt) #edu.studyType \
      #text(size: 8.5pt, fill: text-light)[专业核心：软件工程 | 专业成绩绩点排名前 15% (对齐综测及优秀学生干部标准)]
    ]
  )
}

// 3. 实习与实践经历
#cv-section("实习与实践经历")
#for exp in resume-data.experience {
  cv-item(
    [#exp.startDate -- #exp.endDate],
    [
      *#exp.company* #h(12pt) | #h(12pt) #emph[#exp.position] \
      #text(size: 8.5pt, fill: text-dark)[#exp.summary] \
      #list(
        ..exp.highlights.map(h => text(size: 8.5pt)[#h])
      )
    ]
  )
}

// 4. 核心项目研发
#cv-section("核心项目研发")
#for proj in resume-data.projects {
  let proj-title = [*#proj.name*]
  if proj.url != "" {
    proj-title = proj-title + [ #text(size: 8pt, fill: brand-color)[(#proj.url)] ]
  }
  
  cv-item(
    [#proj.startDate -- #proj.endDate],
    [
      #proj-title #h(10pt) | #h(10pt) #emph[#proj.keywords.join(" · ")] \
      #text(size: 8.5pt, fill: text-dark)[#proj.description] \
      #list(
        ..proj.highlights.map(h => text(size: 8.5pt)[#h])
      )
    ]
  )
}

// 5. 荣誉与奖项
#cv-section("荣誉与奖项")
#cv-item("2025.07", [挑战杯系列赛中国青年科技创新“揭榜挂帅”擂台赛 #text(weight: "bold")[全国二等奖]])
#cv-item("2025.11", [第十九届 iCAN 大使创新创业大赛 #text(weight: "bold")[全国三等奖 / 省级一等奖]])
#cv-item("2025.12", [亚太地区大学生数学建模竞赛 #text(weight: "bold")[全国二等奖]])
#cv-item("2025.10", [第七届全球校园人工智能算法精英大赛 #text(weight: "bold")[省级三等奖]])
#cv-item("2024.04", [蓝桥杯软件与信息技术专业人才大赛 #text(weight: "bold")[省级三等奖 (全省前15%)]])
#cv-item("综合技能", [
  - 日语水平：#text(weight: "bold")[JLPT N2 合格] (Anki词汇+真题复盘高效自学)
  - 资质证书：普通话二级甲等 | 取得 C1 驾驶执照
])

// 6. 个人素质核实
#cv-section("个人素质核实")
#cv-item("自律坚韧", [常州市钟楼区半马顺利完赛，坚持长跑与健身 2 年以上；步道乐跑每学期考核均超 60 次；展现了极高的自律能力。])
#cv-item("利他精神", [校运动会优秀志愿者，累计志愿服务 56 学时；历任班级体育委员等，积极服务同学。])
#cv-item("方法论", [高度自律的 GTD 个人时间精力管理实践者。善用信息调研与逆向 OKR 拆分大型任务。])
