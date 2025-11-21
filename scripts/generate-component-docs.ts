import fs from 'fs';
import path from 'path';
import { parse } from 'react-docgen-typescript';

// ドキュメント生成対象のコンポーネントパス
const componentPaths = [
    'src/components/app-sidebar.tsx',
    'src/app/(APP)/(TOP)/_components/attendance-punch.tsx',
    'src/components/attendance/index.tsx',
    'src/components/page-header/page-header-meta.tsx',
    'src/components/ui/button.tsx',
    'src/components/ui/card.tsx',
];

// オプション設定
const options = {
    savePropValueAsString: true,
    shouldExtractLiteralValuesFromEnum: true,
    propFilter: (prop: any) => {
        if (prop.parent) {
            return !prop.parent.fileName.includes('node_modules');
        }
        return true;
    },
};

// HTMLヘッダー
const htmlHeader = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>コンポーネントドキュメント</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
        h1 { border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 30px; }
        .component-section { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 30px; padding: 24px; }
        .component-title { font-size: 1.5em; font-weight: bold; margin-top: 0; color: #111827; display: flex; align-items: center; gap: 10px; }
        .file-path { font-size: 0.8em; font-weight: normal; color: #6b7280; font-family: monospace; background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
        .description { margin-bottom: 20px; color: #4b5563; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.9em; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; }
        th { background-color: #f9fafb; font-weight: 600; color: #374151; }
        tr:last-child td { border-bottom: none; }
        .prop-name { font-family: monospace; font-weight: 600; color: #2563eb; }
        .prop-type { font-family: monospace; color: #db2777; font-size: 0.9em; }
        .prop-default { font-family: monospace; color: #059669; }
        .required { color: #dc2626; font-size: 0.8em; font-weight: bold; margin-left: 4px; }
        .empty-message { color: #9ca3af; font-style: italic; }
        .nav { margin-bottom: 30px; display: flex; gap: 10px; flex-wrap: wrap; }
        .nav-link { text-decoration: none; color: #4b5563; background: white; padding: 8px 16px; border-radius: 20px; border: 1px solid #e5e7eb; font-size: 0.9em; transition: all 0.2s; }
        .nav-link:hover { border-color: #2563eb; color: #2563eb; }
    </style>
</head>
<body>
    <h1>コンポーネントドキュメント</h1>
    <div class="nav">
`;

// HTMLフッター
const htmlFooter = `
    </div>
</body>
</html>
`;

function generateDocs() {
    const rootDir = process.cwd();
    let navLinks = '';
    let contentHtml = '';

    componentPaths.forEach(filePath => {
        const fullPath = path.join(rootDir, filePath);

        if (!fs.existsSync(fullPath)) {
            console.warn(`File not found: ${fullPath}`);
            return;
        }

        const docs = parse(fullPath, options);

        docs.forEach(doc => {
            const componentName = doc.displayName;
            const anchorId = componentName.toLowerCase();

            navLinks += `<a href="#${anchorId}" class="nav-link">${componentName}</a>`;

            contentHtml += `
            <div id="${anchorId}" class="component-section">
                <h2 class="component-title">
                    ${componentName}
                    <span class="file-path">${filePath}</span>
                </h2>
                <div class="description">${doc.description || '説明はありません'}</div>

                <h3>Props</h3>
                ${Object.keys(doc.props).length > 0 ? `
                <table>
                    <thead>
                        <tr>
                            <th style="width: 20%">Name</th>
                            <th style="width: 25%">Type</th>
                            <th style="width: 15%">Default</th>
                            <th style="width: 40%">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.values(doc.props).map(prop => `
                        <tr>
                            <td>
                                <span class="prop-name">${prop.name}</span>
                                ${prop.required ? '<span class="required">*</span>' : ''}
                            </td>
                            <td><span class="prop-type">${prop.type.name}</span></td>
                            <td><span class="prop-default">${prop.defaultValue ? prop.defaultValue.value : '-'}</span></td>
                            <td>${prop.description}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : '<p class="empty-message">Propsはありません</p>'}
            </div>
            `;
        });
    });

    const finalHtml = `${htmlHeader}${navLinks}</div>${contentHtml}${htmlFooter}`;

    const outputDir = path.join(rootDir, 'public/docs');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(path.join(outputDir, 'components.html'), finalHtml);
    console.log('Component documentation generated at public/docs/components.html');
}

generateDocs();
