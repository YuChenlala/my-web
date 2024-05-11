import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import axios from 'axios';

// ���� pdfjs �� worker ��ַ
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

// ����һ����ΪPdfToImages�ĺ������
async function Pdf2Images ({ pdfUrl }){
  // const response = await axios.get(pdfUrl, {
  //   responseType: 'blob', // ������Ӧ����ΪBlob
  //   withCredentials: true // ���ÿ�������ƾ��
  // });
  console.log(pdfUrl)
  const response = await fetch(pdfUrl, {
    credentials: 'include', // ���ÿ�������ƾ��
  });
  const blob = response.data; // ��ȡPDF�ļ���Blob����

  const pdf = await pdfjs.getDocument(blob).promise; // ��ȡPDF�ĵ�����

  const numPages = pdf.numPages; // ��ȡPDF�ĵ�����ҳ��

  const imageUrls = [];

  for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber); // ��ȡPDF��ÿһҳ

    const viewport = page.getViewport({ scale: 1 }); // ��ȡҳ����ӿ�

    const canvas = document.createElement('canvas'); // ����canvasԪ��
    const context = canvas.getContext('2d'); // ��ȡ2d��ͼ������

    canvas.width = viewport.width; // ����canvas�Ŀ��
    canvas.height = viewport.height; // ����canvas�ĸ߶�

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise; // ��ҳ����Ⱦ��canvas��

    const imageUrl = canvas.toDataURL('image/png'); // ��canvasת��Ϊdata URL
    imageUrls.push(imageUrl); // ��ͼƬURL��ӵ�������
  }

  return imageUrls; // ����ת�����ͼƬURL����
};

export default Pdf2Images; // ����PdfToImages���
