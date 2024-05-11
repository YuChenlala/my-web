import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';

// 设置 pdfjs 的 worker 地址
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

// 定义一个名为PdfToImages的函数组件
async function Pdf2Images ({ pdfUrl }){
  // const response = await axios.get(pdfUrl, {
  //   responseType: 'blob', // 设置响应类型为Blob
  //   withCredentials: true // 启用跨域请求凭据
  // });
  console.log(pdfUrl)
  const response = await fetch(pdfUrl, {
    credentials: 'include', // 启用跨域请求凭据
  });
  const blob = response.data; // 获取PDF文件的Blob对象

  const pdf = await pdfjs.getDocument(blob).promise; // 获取PDF文档对象

  const numPages = pdf.numPages; // 获取PDF文档的总页数

  const imageUrls = [];

  for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber); // 获取PDF的每一页

    const viewport = page.getViewport({ scale: 1 }); // 获取页面的视口

    const canvas = document.createElement('canvas'); // 创建canvas元素
    const context = canvas.getContext('2d'); // 获取2d绘图上下文

    canvas.width = viewport.width; // 设置canvas的宽度
    canvas.height = viewport.height; // 设置canvas的高度

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise; // 将页面渲染到canvas上

    const imageUrl = canvas.toDataURL('image/png'); // 将canvas转换为data URL
    imageUrls.push(imageUrl); // 将图片URL添加到数组中
  }

  return imageUrls; // 返回转换后的图片URL数组
};

export default Pdf2Images; // 导出PdfToImages组件
