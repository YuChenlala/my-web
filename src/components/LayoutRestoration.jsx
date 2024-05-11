
import katex from 'katex';
import React,{ useRef, useState, useEffect } from 'react';

const [htmlContent, setHtmlContent] = useState('<p>This is some initial HTML content.</p><p>This is some initial HTML content.</p>');
const editableRef = useRef(null);

//latex转公式
const renderLaTeX = (latex) => {
    try {
        return katex.renderToString(latex, {
            throwOnError: false, // 遇到错误时不抛出异常
            output: 'html',
        });
    } catch (e) {
        console.error('KaTeX rendering error:', e);
        return latex; // 如果渲染失败，回退到显示原始 LaTeX 代码
    }
};

// 将 OCR 数据转换为 HTML 内容
useEffect(() => {
    if (ocrData) {
    const html = ocrData.map(item => {
        const { position, text, type } = item;
        const style = `position: absolute; top: ${position[0][1] * 100}%; left: ${position[0][0] * 100}%;`;
        const renderedText = type === 'formula' ? renderLaTeX(text) : text;
        return `<div style="${style}" data-type="${type}">${renderedText}</div>`;
    }).join('');
    setHtmlContent(html);
    }
}, [ocrData]);

    // 处理内容编辑完成后的事件
const handleBlur = () => {
    // 获取可编辑元素的当前内容
    const editedHtml = editableRef.current.innerHTML;
    setHtmlContent(editedHtml);

    // 更新 OCR 数据
    let updatedOcrData = { ...ocrData };
    updatedOcrData= Array.from(editableRef.current.children).map(element => {
        const type = element.getAttribute('data-type');
        const position = [
            [parseFloat(element.style.left) / 100, parseFloat(element.style.top) / 100],
            // 可以根据需要添加其他坐标点
        ];
        const text = element.innerText;
        return { position, text, type };
    });
    console.log(updatedOcrData);
    const currentDataList = [...dataList]; // 使用扩展运算符创建副本

    // 修改索引为 0 的元素
    if (currentDataList.length > 0) {
        const updatedElement = { ...currentDataList[currentIndex] }; // 使用扩展运算符创建元素副本
         // 在这里对 updatedElement 进行修改
        updatedElement.data =updatedOcrData;

        // 将修改后的元素放回数组中
        currentDataList[currentIndex] = updatedElement;

        // 更新状态
        setDataList(currentDataList);
    }
    setOcrData(updatedOcrData);
};