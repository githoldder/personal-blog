# Resume Build Pipeline

The resume pipeline parses structural data, validates schema consistency, and generates dual outputs (Web JSON and Print PDF).

## Inputs

- **Data Source**: `content/resume/resume.yaml`
- **Typst Template**: `content/resume/template.typ`

## Schema Specification (`resume.yaml`)

The source file is structured into the following sections:

### 1. `basics` (Object, Required)
- `name` (String, Required)
- `label` (String, Required)
- `email` (String, Required)
- `phone` (String, Required)
- `url` (String, Optional)
- `summary` (String, Optional)
- `location` (String, Optional)

### 2. `education` (Array, Required)
Each object must contain:
- `institution` (String, Required)
- `area` (String, Required)
- `studyType` (String, Required)
- `startDate` (String, Required)
- `endDate` (String, Required)

### 3. `experience` (Array, Required)
Each object must contain:
- `company` (String, Required)
- `position` (String, Required)
- `startDate` (String, Required)
- `endDate` (String, Required)
- `summary` (String, Required)
- `highlights` (Array of Strings, Required)

### 4. `projects` (Array, Required)
Each object must contain:
- `name` (String, Required)
- `description` (String, Required)
- `highlights` (Array of Strings, Required)
- `keywords` (Array of Strings, Required)
- `startDate` (String, Required)
- `endDate` (String, Required)
- `type` (String, Required)
- `url` (String, Optional)

### 5. `skills` (Array, Required)
Each object must contain:
- `name` (String, Required)
- `level` (String, Required)
- `keywords` (Array of Strings, Required)

---

## Outputs

- **Web Target**: `public/assets/resume.json`
- **PDF Print Target**: `public/assets/resume.pdf`

## Build Script

To run the pipeline locally:
```bash
npm run build:resume
```
*Note: If `typst` CLI is not installed locally, PDF compilation will be skipped, but the YAML schema check and JSON export will still execute successfully.*
