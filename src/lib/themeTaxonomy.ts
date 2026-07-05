export type ThemeKey = 'systems' | 'engineering' | 'cognition' | 'planning' | 'language' | 'default';

export const themeTaxonomy: Record<ThemeKey, {
  label: string;
  match: string[];
  vars: Record<string, string>;
}> = {
  systems: {
    label: 'Systems Garden',
    match: ['002_知识体系构建', 'Obsidian', 'canvas', '个人看板', '知识体系'],
    vars: {
      '--theme-a': '#4f8f68',
      '--theme-b': '#d9b86c',
      '--theme-grid': 'rgba(79, 143, 104, .08)'
    }
  },
  engineering: {
    label: 'Engineering Field',
    match: ['011_项目经验', '019_计算机基础', '007_CS自学', 'java', '编程', '软件工程'],
    vars: {
      '--theme-a': '#4878a8',
      '--theme-b': '#d28b55',
      '--theme-grid': 'rgba(72, 120, 168, .08)'
    }
  },
  cognition: {
    label: 'Cognition Lab',
    match: ['003_思维方式', '逻辑学', '本质', '反馈', '思维'],
    vars: {
      '--theme-a': '#8d6b92',
      '--theme-b': '#6fa6a0',
      '--theme-grid': 'rgba(141, 107, 146, .08)'
    }
  },
  planning: {
    label: 'Planning Stream',
    match: ['001_个人规划', '010_时间管理', 'GTD', '可能清单', '计划'],
    vars: {
      '--theme-a': '#b06a5b',
      '--theme-b': '#8ea35b',
      '--theme-grid': 'rgba(176, 106, 91, .08)'
    }
  },
  language: {
    label: 'Language Atlas',
    match: ['009_日语学习', '017_英语学习', '日语', '英语学习', '语法'],
    vars: {
      '--theme-a': '#b96f8a',
      '--theme-b': '#5f93a8',
      '--theme-grid': 'rgba(185, 111, 138, .08)'
    }
  },
  default: {
    label: 'Default Field',
    match: [],
    vars: {
      '--theme-a': '#4f8f68',
      '--theme-b': '#d9b86c',
      '--theme-grid': 'rgba(15, 23, 42, .035)'
    }
  }
};

export function themeFromTags(tags: string[] = []): ThemeKey {
  const normalizedTags = tags.map((tag) => tag.toLowerCase());
  const scored = Object.entries(themeTaxonomy)
    .filter(([key]) => key !== 'default')
    .map(([key, theme]) => {
      const score = theme.match.reduce((sum, matcher) => {
        const normalizedMatcher = matcher.toLowerCase();
        return sum + (normalizedTags.some((tag) => tag.includes(normalizedMatcher) || normalizedMatcher.includes(tag)) ? 1 : 0);
      }, 0);
      return { key: key as ThemeKey, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.score > 0 ? scored[0].key : 'default';
}

export function styleVarsForTheme(theme: ThemeKey = 'default'): string {
  return Object.entries(themeTaxonomy[theme]?.vars || themeTaxonomy.default.vars)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
}
