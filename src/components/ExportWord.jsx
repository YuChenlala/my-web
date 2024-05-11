 
import { saveAs } from "file-saver"
import baidu from "baidu-template-pro"
export const exportWord = ({ mhtml, style, filename, data, selector }) => {
 
    function getModelHtml(mhtml, style = '') {
        return `
              Content-Type: text/html; charset="utf-8"
                <!DOCTYPE html>
                <html>
                <head>
                <style>
                  ${style}
                </style>
                </head>
                <body>
                  ${mhtml}
                </body>
                </html>
              `
    }
    if (selector) {
        let nodes = window.document.querySelectorAll(selector)
        mhtml = nodes.length > 0 ? Array.from(nodes).reduce((a, b) => a + b.innerHTML, '') : ''
    }
    //û��baiduTemplatePro.js����ʱ���봫��selector
    if (!selector && typeof baidu === 'undefined') {
        console.error("wordExport : missing (selector) for params without depandency (baiduTemplatePro.js)");
        return;
    }
    if (typeof saveAs === "undefined") {
        console.error("wordExport : missing dependency (FileSaver.js)");
        return;
    }
    //û��ģ������ʱ������ȡ�ڵ��html�ַ�������ģ��
    let html = typeof baidu !== 'undefined' ? baidu.template(getModelHtml(mhtml, style), data) : getModelHtml(mhtml)
    let blob = new Blob([html], { type: 'application/msword;charset=utf-8' })
    saveAs(blob, filename + '.docx')
}