import React,{ useRef, useState, useEffect } from 'react';
import {
    Layout,
    Nav,
    Button,
    Breadcrumb,
    Skeleton,
    Avatar, 
    TextArea,
    Divider  
} from '@douyinfe/semi-ui';
import { CustomerServiceOutlined, CommentOutlined, QuestionCircleOutlined, FileImageOutlined, FilePdfOutlined, FileWordOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import {
    IconBell,
    IconHelpCircle,
    IconBytedanceLogo,
    IconFeishuLogo,
    IconImage,
    IconArticle
} from '@douyinfe/semi-icons';
import { FloatButton } from 'antd';
import Draggable from 'react-draggable'; // react��ק����
import DraggableDivider from  './components/DraggableDivider'
import { SideSheet, Upload, Spin,Card ,Slider,InputNumber } from '@douyinfe/semi-ui';
import { IconPlus ,IconEdit,IconFontColor,IconMark} from '@douyinfe/semi-icons';
import ImageAnnotator from './components/ImageAnnotator';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import html2pdf from 'html2pdf.js';
import { exportWord } from './components/ExportWord';
import ReactDOMServer from 'react-dom/server';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import Frame from 'react-frame-component';
import './App.css'
import ChatBox from './components/ChatBox';
import { addRow, addColumn } from './components/TableBox';
import TestComponent from './components/TestComponent';
import Formula from './components/Formula';
import robotAvatar from './components/robot.jpg';
import userAvatar from './components/man.jpg';
import axios from 'axios';
import { Document, Page, pdfjs } from 'react-pdf';
import FormulaButtonPlace from './components/Formula';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import { TeX } from 'react-latex-next';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const App = () => {
    const [currentIndex, setCurrentIndex] = useState(-1);  //��ǰʶ���ͼƬ��??
    const [rectangleList, setRectangleList] = useState([]) //������Ϣ
    const [isUpload,setIsUpload] = useState(false);  //�ϴ�??�ж�
    const [file, setFile] = useState([]);  // ͼƬ�б�
    const [dataList, setDataList] = useState([])    //��¼����ʶ??����
    const [ocrData, setOcrData] = useState(null);   //??ǰ��??��ԭ����??����
    const [confidenceThres, setconfidenceThres] = useState(1) //??�Ŷ���??
    const [showImageAnnotator, setShowImageAnnotator] = useState(false); //ͼƬ��ע����


    // �������������ͼƬ��??
    const [selectIndex, setSelectIndex] = useState(-1);
    // ���ڴ���dataList�ı��޷���ʱ??����????
    const [dataListLoading, setDataListLoading] = useState(false);
    const [imageNum, setImageNum] = useState(0);  //??ǰ???��ʶ���ͼƬ��??
    const [currentOcr, setCurrentOcr] = useState(false); // ??����ʾʶ????
    const [picRatio,setPicRatio] = useState(null);
    const url = "http://127.0.0.1:5000";
    //������Ӱ�ť����¼�-----�ų�����??��ʶ??����
    const handleAdd = () => {
        if(!currentOcr) {
            if(file!=null) {
                setShowImageAnnotator(true);
            } else {
                console.log("��ʱ??�ϴ�ͼƬ??")
            }
        }
        
    }
    //������ӱ�ע�ص�����
    const handleImageAnnotatorClose = (annotatedData) => {
        console.log("��ӻص�");
        console.log(annotatedData);
        if (annotatedData.text!=[] && annotatedData.rectangles!=[]) {
        //��Ӿ��崦���ע���ݲ���
        //�������ľ����������??���ݼ���
            const score = 1;
            const position = annotatedData.rectangles;
            const text = annotatedData.text;
            const type = "text";
            const dataObj = {position,score,text,type};
            dataList[currentIndex].data.push(dataObj);
            ocrData.push(dataObj);
            htmlFlash(ocrData)
        }
        //�رս���
        setShowImageAnnotator(false);
    }


    //----------------����??�Ŷ���ֵ��??-------------------
    const saveInputValue = () => {
        let inputValue = document.getElementById("inputValue").value;
        setconfidenceThres(inputValue);
        console.log("��ʾ���õ���ֵ��", inputValue);
    }
   
    //�ı���???��ʽ��??����
    const [model1,setModel1]= useState(false)
    const [model2,setModel2]= useState(false)
    // ������???
    const [highlightIndex,setHighlightIndex] = useState(-1)

    // ����ģʽ---�ų�����??��ʶ??����
    const resetMode1=() => {
        if(!currentOcr) {
            let t = !model1;
            setModel1(t);
            drawImageAndRectangle(file[currentIndex],dataList[currentIndex].data,t,model2);
        };
    }
    
    const resetMode2= () => {
        if(!currentOcr) {
            let t = !model2;
            setModel2(t);
            drawImageAndRectangle(file[currentIndex],dataList[currentIndex].data,model1,t);
        }
    };

    // ͼ����ʾ����
    const canvasRef = useRef(null);

    //��������¼�
    const highLight = (event) => {
        if(dataList[currentIndex].data!=undefined) {
            let rect = canvasRef.current.getBoundingClientRect();
            // ��ȡ�������λ??��Ϣ
            let x0 = event.clientX - rect.left;
            let y0 = event.clientY - rect.top;
            const rectangle = rectangleList.find(item => (
                item.x < x0 && x0 < item.x + item.width && item.y < y0 && y0 < item.y + item.height
            ));
            const index = rectangleList.findIndex((item) => (
                item.x < x0 && x0 < item.x + item.width && item.y < y0 && y0 < item.y + item.height
            ));
            if (rectangle !== undefined){
                const newCanvas = document.createElement('canvas');
                const newCtx = newCanvas.getContext('2d');
                newCanvas.width = rectangleList[index].width;
                newCanvas.height =rectangleList[index].height;
                // ����??λ�õ�������??����
                newCtx.putImageData(rectangle.tempPartImage, 0, 0);
                drawImageAndRectangle(file[currentIndex],dataList[currentIndex].data,model1,model2,index);
                // ����??�Ĵ��ڵ���ʾ
                if (highlightIndex == index){
                     // ����Ĭ???��??ʽ��ʾλ??
                    setFormulaPosition({ x: -40, y: -200 });
                    // ��ȡ��������Ԫ��
                    showDialog(index,function() {
                        // �ӳ�ִ???�ص���??
                        setTimeout(function() {
                            // ��ȡ��������Ԫ��
                            const dialogElement = document.getElementById('show-part-picture');
                            // ���µ�CanvasԪ�����Ϊ����???��Ԫ�ص��ӽڵ�
                            if (ocrData[index].type == "formula"){
                                dialogElement.appendChild(newCanvas);
                                console.log(ocrData[index])
                                setHtmlContent_formula(renderLaTeX(ocrData[index].text));
                            }else if(ocrData[index].type == "text"){
                                dialogElement.appendChild(newCanvas);
                            }else{
                                dialogElement.appendChild(newCanvas);
                                const position = ocrData[index].position;
                                var height = (position[3][1]-position[0][1])*picRatio*editableRef.current.clientWidth;
                                var width = (position[1][0]-position[0][0])*editableRef.current.clientWidth;
                                const regex =  /<table[^>]*>/g;
                                const html = ocrData[index].text.replace(regex, `<table height='${height}px' width='${width}px' border='1' >`);
                                
                                setHtmlContent_table(html)
                            }
                        }, 0);
                    });
                }else{
                    setHighlightIndex(index);
                }
            }
            else {
                htmlFlash(ocrData)
                setHighlightIndex(-1); //ȡ��������???
                drawImageAndRectangle(file[currentIndex],dataList[currentIndex].data,model1,model2,index); // ���µ��û��ƺ���
            }
        }
        
    }
    // ��ͼƬ���и�??����--���λ����???
    // flag3??�����꣬flag1��flag2??��ͬ�ĸ�??ģʽ
    function drawImageAndRectangle (file,data=undefined,flag1 = 0,flag2 = 0,flag3 = -1){
        // console.log("file:", file)
        const blobUrl = URL.createObjectURL(file.fileInstance);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const image = new Image();
        image.src = blobUrl;
        let rectangles = [];
        image.onload = () => {
            // ��ȡͼƬ��ʵ��???�Ⱥ͸�??
            const imageWidth = image.width;
            const imageHeight = image.height;
            // �������ű�������??��ͼƬ���չ̶�����������??
            // �����???��������???�͸�������
            // ����??�̶������???��??1000??600�ģ�����????
            const ratio = imageHeight/imageWidth;
            const displayWidth = imageRef.current.clientWidth;
            const displayHeight = ratio*imageRef.current.clientWidth;
        
             // ??��ͼƬ???���???�Ⱥ͸߶���??
            image.width = displayWidth;
            image.height = displayHeight;
        
            // ���� canvas ��???�Ⱥ͸߶���ͼƬ����ʾ???�Ⱥ͸߶�һ??
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            // ����ͼƬ?? canvas
            ctx.drawImage(image, 0, 0, displayWidth, displayHeight);
            // û�����ݵ�ʱ�����ͼ??
            if(data!==undefined) {
                //��ȡ����;�??����??
                 let rectangles = [];
                 console.log(data)
                 data.map((item, index) => {
                     const { position, score,text, type, } = item;
                     const coordinateList = position;
                     //����x
                     const x1 = coordinateList[0][0];
                     //����y
                     const y1 = coordinateList[0][1];
                     //����x
                     const x2 = coordinateList[1][0];
                     //����y
                     const y4 = coordinateList[3][1];
                     //?? = ����x - ����x
                     const width = (x2 - x1) * image.width
                     //?? = ����y - ����x
                     const height = (y4 - y1) * image.height
                     //x
                     const x = x1 * image.width
                     //y
                     const y = y1 * image.height  
                     // ÿ���������ݶ��洢���Ӧ????
                     const tempPartImage = ctx.getImageData(x, y, width, height)
                     const rItem = { x, y, width, height, index, tempPartImage}
                     rectangles.push(rItem)
                     // ����??
                     if(flag2){
                         ctx.fillStyle ='rgb(110, 175, 230, 0.4)';
                         ctx.fillRect(x, y, width, height);
                         ctx.font = '14px Arial';  // ���������С��������??
                         ctx.fillStyle = 'rgb(35, 105, 240)';
                         ctx.fillText(`${index}`, x, y);  // ��λ??(x,y)�����ı�����1
                     }
                     if(index == flag3){
                         ctx.fillStyle ='rgb(250, 60, 32, 0.4)';
                         ctx.fillRect(x, y, width, height);
                         ctx.font = '14px Arial';  // ���������С��������??
                         ctx.fillStyle = 'rgb(35, 105, 240)';
                         ctx.fillText(`${index}`, x, y);  // ��λ??(x,y)�����ı�����1
                        //  const html = ocrData.map((item,index) => {
                        //      const { position, text, type } = item;
                        //      const style = type === 'table' ? `  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px;  left: ${position[0][0] * 100}%;`: `  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px; left: ${position[0][0] * 100}%; `;
                        //     //  const style = type === 'table' ? `  position: absolute; top: ${position[0][1] * 100}%; left: ${position[0][0] * 100+10}%; `: `  position: absolute; top: ${position[0][1] * 100}%; left: ${position[0][0] * 100}%; `;
                        //      const renderedText = type != 'table' ? renderLaTeX(text) : text;
                        //      // return `<div style="${style}" data-type="${type}">${renderedText}</div>`;
                        //      if (index == flag3 ){
                        //          return `<div style="color: rgb(255,109,84); ${style}" data-type="${type}">
                        //                      ${renderedText}
                        //                  </div>`
                        //      }else{
                        //          return `<div style="${style}" data-type="${type}">${renderedText}</div>`;
                        //      }
                        //  }).join('');
                        //  setHtmlContent(html);
                         const html = ocrData.map((item,index) => {
                            const { position, text, type } = item;
                            var style,renderedText,fontSize;
                            if (type == 'table'){
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(text, 'text/html');
                                const rows = doc.querySelectorAll('table tr');
                                const columns = rows[0] ? rows[0].children : [];
                                const rowlen = rows.length;
                                const collen = columns.length;
                                var height = (position[3][1]-position[0][1])*picRatio*editableRef.current.clientWidth;
                                var width = (position[1][0]-position[0][0])*editableRef.current.clientWidth;
                                var newWidth = width/collen;
                                var newHeight = height/rowlen*0.65;
                                console.log(rowlen);
                                const regex =  /<table[^>]*>/g;
                                const html = text.replace(regex, `<table height='${height}px' width='${width}px' border='1' >`);
                                console.log(html);
                                renderedText = html;
                                const fontSize = newHeight ;
                                style =`  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px; left: ${position[0][0] * 100}%; width:${width}px;font-size: ${fontSize}px`;
                            }else if(type == 'text'){
                                var fontSize = (position[0][1]-position[3][1])*picRatio*editableRef.current.clientWidth;
                                style =`  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px; left: ${position[0][0] * 100}%;`;
                                renderedText = text
                                
                            }else{
                                style =`  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px; left: ${position[0][0] * 100}%;`;
                                renderedText =  renderLaTeX(text);
                            }
                            // return `<div style="${style}" data-type="${type}">${renderedText}</div>`;
                            if (index ==   flag3){
                                return `<div style="color: red; ${style} ;" data-type="${type}">
                                            ${renderedText}
                                        </div>`
                            }else{
                                return `<div style="${style} ;" data-type="${type}">${renderedText}</div>`;
                            }
                        }).join('');
                        setHtmlContent(html);
                     }
                     if (flag1){
                         if(score <= confidenceThres){
                             ctx.strokeStyle ='rgb(255, 20, 20)';
                         }else{
                             ctx.strokeStyle ='rgb(235, 140, 20)';
                         }
                         
                         ctx.lineWidth = 0.8;
                         ctx.strokeRect(x, y, width, height);
                         ctx.font = '14px Arial';  // ���������С��������??
                         ctx.fillStyle = 'rgb(35, 105, 240)';
                         ctx.fillText(`${index}`, x, y);  // ��λ??(x,y)�����ı�����1
                     }
                 });
                setRectangleList([...rectangles]);
            }
            else{
                setHtmlContent_demo(null);
            }
            URL.revokeObjectURL(blobUrl);
        }
    }

   //---------------���滹ԭ-----------------
    
    const [htmlContent, setHtmlContent] = useState(`
    
    <div style="color: gray; display: flex; justify-content: center; align-items: center; flex-direction: column; margin-top: 200px;">
        <p style="font-size: 32px;">ʶ��ԭ����</p>
        <p style="font-size: 32px;">��???ʶ??���׼ȷ��ԭ</p>
    </div>    
    `);
    const [htmlContent_demo, setHtmlContent_demo] = useState(`
    <div style="color: gray; display: flex; justify-content: center; align-items: center; flex-direction: column; margin-top: 200px;">
        <p style="font-size: 32px;">ͼƬ��ʾ����</p>
        <p style="font-size: 32px;">����·���Ӱ������ͼƬ</p>
    </div>    
    `);
    const [htmlContent_table, setHtmlContent_table] = useState(``);
    const [htmlContent_formula, setHtmlContent_formula] = useState(``);
    const editableRef = useRef(null);
    const tableEditableRef = useRef(null);
    const imageRef = useRef(null);
    //latex??????
    const renderLaTeX = (latex) => {
            return ReactDOMServer.renderToString(<InlineMath >{latex}</InlineMath>);
    };
    
    useEffect(() => {
        // console.log(ocrData);
        // console.log("daadsdasd");
        // console.log(picRatio);
        if (ocrData) {
            const html = ocrData.map((item,index) => {
                const { position, text, type } = item;
                // // const style = type === 'table' ? `  position: absolute; top: ${position[0][1] * 100}%; left: ${position[0][0] * 100+10}%; `: `  position: absolute; top: ${position[0][1]*100}%; left: ${position[0][0] * 100}%; `;
                // const style = type === 'table' ? `  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px;  left: ${position[0][0] * 100}%;`: `  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px; left: ${position[0][0] * 100}%; `;
                // const renderedText = type != 'table' ? renderLaTeX(text) : text;
                // const fontSize = (position[0][1]-position[3][1])*picRatio*editableRef.current.clientWidth;
                var style,renderedText,fontSize;
                
                if (type == 'table'){
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, 'text/html');
                    const rows = doc.querySelectorAll('table tr');
                    const columns = rows[0] ? rows[0].children : [];
                    const rowlen = rows.length;
                    const collen = columns.length;
                    var height = (position[3][1]-position[0][1])*picRatio*editableRef.current.clientWidth;
                    var width = (position[1][0]-position[0][0])*editableRef.current.clientWidth;
                    var newWidth = width/collen;
                    var newHeight = height/rowlen*0.65;
                    console.log(rowlen);
                    const regex =  /<table[^>]*>/g;
                    const html = text.replace(regex, `<table height='${height}px' width='${width}px' border='1' >`);
                    console.log(html);
                    renderedText = html;
                    const fontSize = newHeight ;
                    style =`  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px; left: ${position[0][0] * 100}%; width:${width}px;font-size: ${fontSize}px`;
                }else if(type == 'text'){
                    var fontSize = (position[0][1]-position[3][1])*picRatio*editableRef.current.clientWidth;
                    style =`  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px; left: ${position[0][0] * 100}%;`;
                    renderedText = text
                    
                }else{
                    style =`  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px; left: ${position[0][0] * 100}%;`;
                    renderedText =  renderLaTeX(text);
                }
                // return `<div style="${style}" data-type="${type}">${renderedText}</div>`;
                if (index ==    highlightIndex ){
                    return `<div style="color: red; ${style} ;" data-type="${type}">
                                ${renderedText}
                            </div>`
                }else{
                    return `<div style="${style} ;" data-type="${type}">${renderedText}</div>`;
                }
            }).join('');
            setHtmlContent(html);
        }
    }, [ocrData,picRatio]);

    function htmlFlash(data){
        const html = data.map((item,index) => {
            const { position, text, type } = item;
            // // const style = type === 'table' ? `  position: absolute; top: ${position[0][1] * 100}%; left: ${position[0][0] * 100+10}%; `: `  position: absolute; top: ${position[0][1]*100}%; left: ${position[0][0] * 100}%; `;
            // const style = type === 'table' ? `  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px;  left: ${position[0][0] * 100}%;`: `  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px; left: ${position[0][0] * 100}%; `;
            // const renderedText = type != 'table' ? renderLaTeX(text) : text;
            // const fontSize = (position[0][1]-position[3][1])*picRatio*editableRef.current.clientWidth;
            var style,renderedText,fontSize;
            
            if (type == 'table'){
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');
                const rows = doc.querySelectorAll('table tr');
                const columns = rows[0] ? rows[0].children : [];
                const rowlen = rows.length;
                const collen = columns.length;
                var height = (position[3][1]-position[0][1])*picRatio*editableRef.current.clientWidth;
                var width = (position[1][0]-position[0][0])*editableRef.current.clientWidth;
                var newWidth = width/collen;
                var newHeight = height/rowlen*0.65;
                console.log(rowlen);
                const regex =  /<table[^>]*>/g;
                const html = text.replace(regex, `<table height='${height}px' width='${width}px' border='1' >`);
                console.log(html);
                renderedText = html;
                const fontSize = newHeight ;
                style =`  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px; left: ${position[0][0] * 100}%; width:${width}px;font-size: ${fontSize}px`;
            }else if(type == 'text'){
                var fontSize = (position[0][1]-position[3][1])*picRatio*editableRef.current.clientWidth;
                style =`  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px; left: ${position[0][0] * 100}%;`;
                renderedText = text
                
            }else{
                style =`  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px; left: ${position[0][0] * 100}%;`;
                renderedText =  renderLaTeX(text);
            }
            // return `<div style="${style}" data-type="${type}">${renderedText}</div>`;
            return `<div style="${style} ;" data-type="${type}">${renderedText}</div>`;
            
        }).join('');
        setHtmlContent(html);
    }
    // ����htmlContent�ı仯��ÿ��htmlContent����ʱ��������Ⱦ���
    useEffect(() => {
        // ���������ִ����htmlContent�йص������߼�
    }, [htmlContent]);
    
    useEffect(() => {
        if(currentIndex!=-1 &&dataList[currentIndex].data!==undefined){
            setModel1(1);
            drawImageAndRectangle(file[currentIndex], dataList[currentIndex].data, 1);
        }
    }, [confidenceThres]);


    // ������???�༭��ɺ����??
    const handleBlur = () => {
        // ��ȡ??�༭Ԫ�صĵ�ǰ��??
        const editedHtml = editableRef.current.innerHTML;
        setHtmlContent(editedHtml);

        // ���� OCR ����
        let updatedOcrData = { ...ocrData };
        updatedOcrData= Array.from(editableRef.current.children).map((element,index)=> {
            const type = element.getAttribute('data-type');
            const position =ocrData[index].position;
            // const length = ocrData[index].text.length; 
            // console.log("���ȶԱ�:",length,"�ı�",element.innerText.length)
            const elementText = element.innerText;
            let newlineIndex = -1;
            for (let i = elementText.length - 1; i >= 0; i--) {
                if (elementText[i] === '\n') {
                    newlineIndex = i;
                    break; // �ҵ�??һ??��??????��ͣ???ѭ??
                }
            }
            let Text = null
            if (newlineIndex !== -1) {
                Text = elementText.substring(newlineIndex + 1); // ??ȡ����???����Ĳ���
            } else {
                console.log("??�ҵ���??????");
            }
            let text;
            if (type === "table") {
                text = element.innerHTML;
            } else if (type === "formula") {
                console.log("formula:",element.innerText);
                text = ocrData[index].text;
            } else {
                text = element.innerText; // ����?? Text ??��ԭ�������еı�����������ԭ�߼�
            }
            const score = ocrData[index].score;
            return { position, text, type,score };
        });
        const currentDataList = [...dataList]; 

        // ??������Ϊ 0 ��Ԫ??
        if (currentDataList.length > 0) {
            const updatedElement = { ...currentDataList[currentIndex] }; 
            updatedElement.data =updatedOcrData;
            currentDataList[currentIndex] = updatedElement;
            setDataList(currentDataList);
        }
        console.log(updatedOcrData);
        setOcrData(updatedOcrData);
    };

    const handleBlur_table = ()=>{
        
    }
    //-------------ͼƬѡ���ǰ��???����---------------
    // ��ͼƬ�� URL ??�����ļ�
    async function urlToBlob(url) {
      const response = await fetch(url);
      const blob = await response.blob();
      return blob;
    }
    
    //����ͼƬ����¼�
    function imageSelect(File){
        setModel1(false);
        setModel2(false);
        console.log("��ǰ���", File);
        file.forEach((item, index)=>{
            if(item.url == File.url){
                // console.log("�������±�", index);
                // setSelectIndex(index);
                setCurrentIndex(index);
                console.log("�±�??", index);
                console.log("����", dataList[index].data);
                if(dataList[index].data !== undefined) {
                    const image = new Image();
                    image.src = item.url;
                    const imageWidth = image.width;
                    const imageHeight = image.height;
                    const ratio = imageHeight/imageWidth;
                    console.log("radio",ratio);
                    if (ratio != NaN){
                        setPicRatio(ratio);
                    }
                    setCurrentOcr(false);
                    drawImageAndRectangle(File, dataList[index].data);
                    setOcrData(dataList[index].data);
                }
                else {
                    drawImageAndRectangle(File);
                    setCurrentOcr(true); // ����Ϊʶ????
                }
            }
        })
    }
    
    function dataURLtoBlob(dataUrl) {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }
    // ����������???���ļ���С
    function calculateFileSize(size) {
        const KB = size / 1024; // ���ֽ�ת??ΪKB
        return KB.toFixed(2); // ������λС��
    }

    async function createFileInstanceFromUrl(url) {
        try {
           // ʹ�� fetch ��ȡ URL ָ�����??
          const response = await fetch(url);
          const blob = await response.blob(); //����Ӧ��???????? Blob ����
      
          // ����һ??�µ� File ���󣬽� Blob ������Ϊ�������ݸ����캯??
          const fileInstance = new File([blob], 'filename.pdf', { type: 'application/pdf' });
      
          return fileInstance;
        } catch (error) {
          console.error('Error creating File instance:', error);
          return null;
        }
    }

    useEffect(() => {

        if (imageNum < file.length) {
            drawImageAndRectangle(file[imageNum])
            setCurrentOcr(true);
            setCurrentIndex(imageNum);
      
          for (let i = imageNum; i < file.length; i++) {
            const currentFile = file[i];
            // console.log("??ǰ???��ʶ����ļ���", currentFile);
            imageOCR(currentFile);
            setImageNum(imageNum+1);
          }
           // ���� imageNum ��ֵ���Ա���???����ʱ��???ȷ��λ??��ʼ???��
          setImageNum(file.length);
        }
      }, [file, imageNum]);
    
    
    useEffect(() => {
        if(currentIndex!=-1 &&dataList[currentIndex].data!==undefined){
            setCurrentOcr(false);
            drawImageAndRectangle(file[currentIndex], dataList[currentIndex].data);
        }
    }, [dataList, currentIndex]);
    
    // �ϴ��¼�
    const  imageUpload = async ({ fileList, currentFile, event }) => {
        setIsUpload(true);
        console.log("�ϴ��������??", fileList);
        // �ȴ���һ??��fileList��ͬ���ȵ�dataList
        const tempDataList = fileList.map(file => {
            const dataObj = dataList.find(data => data.url === file.url);
            return {
              url: file.url,
              data: dataObj ? dataObj.data : undefined
            };
          });

        const fileExtension = fileList[fileList.length-1].name.split('.').pop();
        // pdf�ļ��ϴ�����
        if (fileExtension.toLowerCase() == "pdf") {
            // pdf���ͼƬ����file??
            try {
                    //const imageUrls = await Pdf2Images(fileList[fileList.length-1].url);
                    const response = await axios.get(fileList[fileList.length-1].url, {
                        responseType: 'blob', // ������Ӧ����ΪBlob
                    });
                    const blob = response.data; // ��ȡPDF�ļ���Blob����
                    // ��??????��
                    const arrayBuffer = await blob.arrayBuffer(); 
                    const pdf = await pdfjs.getDocument({
                        data: arrayBuffer,}).promise; // ��ȡPDF�ĵ�����

                    const numPages = pdf.numPages; // ��ȡPDF�ĵ�����ҳ??
                    // const imageUrls = [];
                    const name = `${fileList[fileList.length-1].name}`
                    console.log(numPages);
                    // �Ƴ�pdf���󣬺�??�滻��ÿ��ͼ??
                    fileList.pop();
                    tempDataList.pop();
                    for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
                        const page = await pdf.getPage(pageNumber); // ��ȡPDF��ÿһ??
                    
                        const viewport = page.getViewport({ scale: 1.5 }); // ��ȡҳ���???��
                    
                        const canvas = document.createElement('canvas'); // ����canvasԪ��
                        const context = canvas.getContext('2d'); // ��ȡ2d��ͼ����??
                    
                        canvas.width = viewport.width; // ����canvas��???��
                        canvas.height = viewport.height; // ����canvas�ĸ�??
                    
                        const renderContext = {
                          canvasContext: context,
                          viewport: viewport
                        };
                    
                        await page.render(renderContext).promise; // ��ҳ����Ⱦ��canvas??
                    
                        const dataUrl = canvas.toDataURL('image/png'); // ��canvas????Ϊdata URL
                        const b = dataURLtoBlob(dataUrl);
                        const imageUrl = URL.createObjectURL(b);
                        const fileName = `${name}_${pageNumber}.png`; // �����ļ�??
                        const fileSize = calculateFileSize(b.size); // �����ļ���С
                        const path = imageUrl; // ����ͼƬURL
                        const fileInstance = await createFileInstanceFromUrl(imageUrl);

                        // ��ͼƬURL��ӵ�������
                        fileList.push({
                            event: event,
                            fileInstance: fileInstance,
                            uid: `${name}_${pageNumber}`,
                            name: fileName,
                            percent: 100,
                            preview: true,
                            response: 'success',
                            size: `${fileSize}KB`,
                            status: 'success',
                            url: path,
                        });
                        const dataObj = { url: path, data: undefined }
                        tempDataList.push(dataObj);
                        //fileList.push(fileList[fileList.length-1]); // ��ͼƬURL��ӵ�������
                    }
                    setFile(fileList);  
                    setDataList(tempDataList);
              } catch (error) {
                console.error('Error processing PDF:', error);
              }
        } else {
            // �ļ�����Ϊͼ??
            setFile(fileList);
            setDataList(tempDataList);
        }
        setIsUpload(false);
    };

    // �Ƴ��Ļص���??---??ǰû??
    const imageRemove = async ({fileList}) => {
        // console.log("�Ƴ��ļ��Ļص���", imageNum-1);
        // setImageNum(imageNum-1);

    }

    // ʶ����
    // imageNum---����ʶ���ͼƬ��??
    async function imageOCR2 (File){
        // setIsUpload(true);
        console.log("??ǰͼƬ�б��ȣ�", File.length)
        console.log("����ʶ��һ�Σ�")
        const formData = new FormData();
        // һ��ֻʶ��һ??
        if(File.length-imageNum > 0) {
            const url = File[imageNum].url;
            console.log("��ʶ??ͼƬ��url:", url);
            setImageNum(imageNum+1);
            const blob = await urlToBlob(url);
            formData.append('image', blob);

        }
        // for(let i = imageNum; i < File.length; i++){
        //     const url = File[i].url;
        //     // console.log(url);
        //     // setImageNum(imageNum+1);
        //     const blob = await urlToBlob(url);
        //     formData.append('image', blob);
        // }
        try {
            fetch('https://8eb3-222-212-86-164.ngrok-free.app/one-image', {
                method: 'POST',
                body: formData,
                mode: 'cors',
            })
            //������???��������
            .then(response => response.json())
            .then(Data => {
                // console.log("��������??",Data['OCR_data']);
                Data['OCR_data'].forEach(function(item,index) {
                    // ��?????????ÿ??��ִ�в�??
                    // ����
                    const data = [...Data].sort((a, b) => {
                        // ???? a ?? b ?? position ����
                        if (a.position && b.position) {
                        // ???? position ??��???һ??Ԫ�ش���
                        if (a.position[0] && b.position[0]) {
                            // �Ƚ�����??
                            if (a.position[0][1] < b.position[0][1]) {
                            return -1;
                            } else if (a.position[0][1] > b.position[0][1]) {
                            return 1;
                            } else {
                            // �����������ȣ���ȽϺ�����
                            if (a.position[0][0] < b.position[0][0]) {
                                return -1;
                            } else if (a.position[0][0] > b.position[0][0]) {
                                return 1;
                            } else {
                                return 0; // ���??����Ҳ��ȣ�����0
                            }
                            }
                        }
                        }
                        return 0; // Ĭ???��??0�����Ը�??�����������
                    });
                    const url = File[imageNum+index].url
                    // console.log(data);
                    const dataObj = { url, data };
                    // Ĭ???��ʾ???һ��ͼƬ����Ϣ�Ĳ�??
                    if(url==File[0].url){
                        drawImageAndRectangle(File[0], data);
                        setCurrentIndex(0);
                        setOcrData(data);
                    }
                    dataList.push(dataObj);
                }
                )}
                );
                // setIsUpload(false);
            
            } catch (error) {
                console.error('������?????', error);
            }
            // setImageNum(File.length);
            // setPdfFlag(0);
    }

    async function imageOCR (File){
        const url = File.url;
        const formData = new FormData();
        const blob = await urlToBlob(url);
        formData.append('image', blob);
        try {
            //  http://127.0.0.1:5000/upload
            // https://7916-211-83-127-29.ngrok-free.app/one-image
            fetch('http://127.0.0.1:10009/one-image', {
                method: 'POST', 
                body: formData,
                mode: 'cors',
            })
            //������???��������
            .then(response => response.json())
            .then(Data => {
                // ����
                const data = [...Data].sort((a, b) => {
                    // ???? a ?? b ?? position ����
                    if (a.position && b.position) {
                        // ???? position ??��???һ??Ԫ�ش���
                        if (a.position[0] && b.position[0]) {
                        // �Ƚ�����??
                        if (a.position[0][1] < b.position[0][1]) {
                            return -1;
                        } else if (a.position[0][1] > b.position[0][1]) {
                            return 1;
                        } else {
                            // �����������ȣ���ȽϺ�����
                            if (a.position[0][0] < b.position[0][0]) {
                            return -1;
                            } else if (a.position[0][0] > b.position[0][0]) {
                            return 1;
                            } else {
                            return 0; // ���??����Ҳ��ȣ�����0
                            }
                        }
                        }
                    }
                    return 0; // Ĭ???��??0�����Ը�??�����������
                });

                for(let i=0; i<dataList.length; i++) {
                    if(dataList[i].url===url) {
                        dataList[i].data = data;
                        break;
                    }
                }
                setDataList(dataList);
                console.log("ʶ����dataList:", dataList);
                setDataListLoading(true);
                // // Ĭ???��ʾ???һ��ͼƬ����Ϣ�Ĳ�??
                // if(url==file[0].url){
                //     drawImageAndRectangle(file[0], data);
                //     setCurrentIndex(0);
                //     setCurrentOcr(false);
                //     setOcrData(data);
                // }
                // dataList.push(dataObj);
            })
        } catch (error) {
            console.error('������?????', error);
        }
    }


    // ���dataList�ı仯�Ի�ȡ����֮����°��滹ԭ��Ϣ
    useEffect(() => {
        setDataListLoading(false);
        if(currentIndex!=-1 && currentIndex<file.length && dataList[currentIndex].data!==undefined) {
            const image = new Image();
            image.src =file[currentIndex].url;
            const imageWidth = image.width;
            const imageHeight = image.height;
            const ratio = imageHeight/imageWidth;
            console.log("radio",ratio);
            if (ratio != NaN){
                setPicRatio(ratio);
            }
            setCurrentOcr(false);
            drawImageAndRectangle(file[currentIndex], dataList[currentIndex].data);
            setOcrData(dataList[currentIndex].data);
        }
        else if(currentIndex!=-1) {
            // ���õ�ǰͼƬΪʶ????
            setCurrentOcr(true);
        }
    }, [dataListLoading, currentIndex]);


    //����ʵ�֡�����������ʵ??
    const [visible, setVisible] = useState(false);
    const [text, setText] = useState('');

    // ??�ĵ����ĳ���--index���ص���??
    function showDialog(index,callback) {
        if(index != -1){
            setVisible(true);
            setText(ocrData[index].text);
            if(typeof callback === 'function'){
                callback();
            }
        }
    }
    
    // ��???�޸ĵ�????
    const handleOk = () => {
        if(ocrData[highlightIndex].type != 'table'){
            setVisible(false);
            let text0 = ocrData;
            text0[highlightIndex].text = text;
            dataList[currentIndex].data = text0;
            setDataList(dataList);
            setOcrData(text0);
            if (text0) {
                htmlFlash(ocrData)
            }
            drawImageAndRectangle(file[currentIndex],dataList[currentIndex].data,model1,model2)
            setHtmlContent_formula(renderLaTeX(""))
        }else{
            const editedHtml = tableEditableRef.current.innerHTML;
            const newOcrData = [...ocrData]; // ���� ocrData �ĸ�??
            // ??�ĸ�???? highlightIndex ���� text ����??
            newOcrData[highlightIndex].text = editedHtml;
            const currentDataList = [...dataList]; 
            if (currentDataList.length > 0) {
                const updatedElement = { ...currentDataList[currentIndex] }; 
                updatedElement.data =newOcrData;
                currentDataList[currentIndex] = updatedElement;
                setDataList(currentDataList);
            }
            setOcrData(newOcrData);
            setVisible(false);
            drawImageAndRectangle(file[currentIndex],dataList[currentIndex].data,model1,model2)
            htmlFlash(newOcrData);
            setHighlightIndex(-1)
        }
    };

    const handleCancel = () => {
        setVisible(false);
        drawImageAndRectangle(file[currentIndex],dataList[currentIndex].data,model1,model2)
        htmlFlash(ocrData)
        setHighlightIndex(-1)
        setHtmlContent_formula(renderLaTeX(""))
    };
    const handleSelectionChange = (event) =>{
        setText(event.target.value);
    }
    // ɾ��ĳ����???
    const handleDec = () => {
        console.log("ɾ��");
        // ��û�и�??����index��ʱ??-1
        if (highlightIndex != -1) {
          //����currentTextList
            ocrData.splice(highlightIndex, 1);
            htmlFlash(ocrData)
          //����dataList
          dataList[currentIndex].data.splice(highlightIndex, 1);
        }
        // �رյ���
        handleCancel();
    }
    //??����ʵ??
    const [messages, setMessages] = useState([
        {
          content: '��ã���ʲô���԰��������',
          sender: 'System',
          timestamp: new Date().toLocaleTimeString(),
          avatar: robotAvatar,
        },
      ]);
    const [chatVisible, setChatVisible] = useState(false);
    // ??���ܵĵ���¼�
    const change = () => {
        setChatVisible(!chatVisible);
    };


    const downloadPDFFile = async () => {
        const response = await fetch('http://127.0.0.1:5000/convertToPdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ html: htmlContent }),
        });
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'document.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
        } else {
            console.error('Failed to generate PDF');
        }
    }
    const downloadImgFile = async () => {
        const response = await fetch('http://127.0.0.1:5000/convertToImg', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ html: htmlContent }),
        });
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'document.png';
            document.body.appendChild(a);
            a.click();
            a.remove();
          } else {
            console.error('Failed to generate Image');
          }
    }

    // ���??ʽ???�ŵĺ�??
    const handleSymbolClick = (symbol) => {
        // ����??�Ĵ��ںͰ��滹ԭ������������
        if (visible==true) {
            /// ��ʱ��λ���޸Ĵ�??
            let textarea = document.getElementById("modified");
            if (textarea.selectionStart !== undefined && textarea.selectionEnd !== undefined && textarea.value !== undefined) {
                const { selectionStart, selectionEnd, value } = textarea;
                const newValue =
                value.substring(0, selectionStart) +
                symbol +
                value.substring(selectionEnd, value.length);
                textarea.value = newValue;
                textarea.focus();
                textarea.setSelectionRange(selectionStart + symbol.length, selectionStart + symbol.length);
                // ���Ϊ�޸Ĵ��ڣ����ú�������
                setText(newValue);
              } else {
                // ����û�й���û����??�������??
              }
        }else{
            // ���滹ԭ����??
        }
        
        
      };

    // ��ק��־
    const [isQuestionDragging, setIsQuestionDragging] = useState(false);
    const [isFormulaDragging, setIsFormulaDragging] = useState(false);
    const [isButtonDragging, setIsButtonDragging] = useState(false);
    // const [isAnnotatorDragging, setIsAnnotatorDragging] = useState(false);
    // λ��
    const [formulaPosition, setFormulaPosition] = useState({ x: -40, y: -200 });
    const [questionPosition, setQuestionPosition] = useState({ x: -50, y: -20 });
    const [buttonPosition, setButtonPosition] = useState({x: 0, y: 0});
    // const [annotatorPosition, setAnnotatorPosition] = useState({x: 0, y: 0});

    // ??��������ק����
    const handleDrag2 = (e, ui) => {
        setIsQuestionDragging(true);
        // ��ȡ�϶�ƫ��??
        const { x, y } = ui;
        setQuestionPosition(prevPosition => ({
          x: prevPosition.x + x,
          y: prevPosition.y + y
        }));
    };
    
    //??ʽ��ʾ����ק����
    const handleDrag1 = (e, ui) => {
        setIsFormulaDragging(true);
        // ��ȡ�϶�ƫ��??
        const { x, y } = ui;
        setFormulaPosition(prevPosition => ({
          x: prevPosition.x + x,
          y: prevPosition.y + y
        }));
    };
    // ����������ק����
    const handleDrag3 = (e, ui) => {
        setIsButtonDragging(true);
        // ��ȡ�϶�ƫ��??
        const {x, y} = ui;
        setButtonPosition(prevPosition => ({
            x: prevPosition.x + x,
            y: prevPosition.y + y
        }));
    };
    // // ��Ӵ��ڵ���ק��??
    // const handleDrag4 = (e, ui) => {
    //     setIsAnnotatorDragging(true);
    //     // ��ȡ�϶�ƫ��??
    //     const {x, y} = ui;
    //     setAnnotatorPosition(prevPosition => ({
    //         x: prevPosition.x + x,
    //         y: prevPosition.y + y
    //     }));
    // }


    const { Header, Footer, Sider, Content } = Layout;

    return (
        <Layout style={{ 
            border: '1px solid var(--semi-color-border)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            backgroundColor: '#f0f0f0'
            }}>

            {/* ͷ������ */}
            <Header>
                <div>
                    <Nav mode="horizontal" defaultSelectedKeys={['Home']} style={{ backgroundColor: 'rgb(32,161,255)', height: '60px', boxShadow:'2px, 2px, 2px, rgba(194, 210, 255, .35)' }}>
                        {/* ͼ�� */}
                        <Nav.Header>
                            <IconFeishuLogo style={{  color: '#fff', height: '40px', fontSize: 40 }}/>
                        </Nav.Header>
                        {/* ����?? */}
                        <span
                            style={{
                                color: 'var(--semi-color-text-2)',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <span
                                style={{
                                    marginRight: '24px',
                                    color: '#fff',
                                    fontWeight: '600',
                                    fontSize: '25px',
                                    // fontFamily: 'cursive',
                                    // fontFamily: 'Arial',
                                }}
                            >
                               ����OCR
                            </span>
                        </span>
                        {/* �󲿹���?? */}
                        <Nav.Footer>
                            <Button
                                theme="borderless"
                                icon={<IconBell size="large" />}
                                style={{
                                    // color: 'var(--semi-color-text-2)',
                                    color: '#fff',
                                    marginRight: '12px',
                                }}
                            />
                            <Button
                                theme="borderless"
                                icon={<IconHelpCircle size="large" />}
                                style={{
                                    // color: 'var(--semi-color-text-2)',
                                    color: '#fff',
                                    marginRight: '12px',
                                }}
                            />
                        </Nav.Footer>
                    </Nav>
                </div>
            </Header>

            {/* ��???ҳ */}
            <Content
                    style={{
                        padding: '2px',
                        height: '80vh', 
                        backgroundColor: '#f0f0f0',
                        // overflowY: 'auto' 
                    }}
                >
                   {/* <div style={{height: '100%', width: '100%'}}> */}
                     {/* չʾ���� */}
                    <div
                        style={{
                            // borderRadius: '10px',
                            border: '1px solid var(--semi-color-border)',
                            height: '80%',
                            padding: '5px',
                            backgroundColor: 'white',
                            marginBottom: '1px',
                            position: 'relative',
                        }}
                    >
                        {/* ??��ֽ��� */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '0',
                                left: '50%', // ������???��??
                                height: '100%',
                                width: '2px',// �ֽ���???��
                                backgroundColor: 'transparent', // ��ʵ�߸�Ϊ͸��
                                borderLeft: '2px dashed grey', // ʹ��������ʽ
                                zIndex: '1', // ??��������������???��??
                            }}
                        />


                        {/* ͼƬ */}
                        <div
                            style={{
                                width: '50%', // ���Ҷ԰�
                                height: '100%', // ��ȫ??�丸����
                                display: 'inline-block', // ���ڿ鼶Ԫ��
                                verticalAlign: 'top', // ��������
                            }}
                        >

                            {/* ͼƬ?? */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '0',
                                    left: '0',
                                    width: '50%',
                                    height: '100%', // �ϲ���ռ??9
                                    backgroundColor: 'white', // ��ӷֽ�??
                                    overflow: 'auto', // ��ӹ���??
                                }}
                                ref={imageRef}
                            >
                                {currentIndex === -1 ? ( 
                                    <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '100px',
                                        color: 'gray',
                                        height: '100%', // ���ø߶�Ϊ???�ڵĸ�??
                                    }}
                                >
                                    <IconImage size='extra large' />
                                    <p style={{ fontSize: '32px', marginBottom: '10px' }}>ͼƬ��ʾ����</p>
                                    <p style={{ fontSize: '32px', marginTop: '0' }}>����·���Ӱ������ͼƬ</p>
                                </div>
                                    ) : null}
                                <canvas ref={canvasRef} className='image'  onClick={(e) => highLight(e)} />
                            </div>
                        </div>

                        {/* ���滹ԭ */}
                        <div
                            style={{
                                width: '50%', // ���Ҷ԰�
                                height: '100%', // ��ȫ??�丸����
                                display: 'inline-block', // ���ڿ鼶Ԫ��
                                verticalAlign: 'top', // ��������
                            }}
                        >
                            {/* ���滹ԭ?? */}
                            {!currentOcr ?(
                                currentIndex === -1?(<div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '100px',
                                        color: 'gray',
                                        height: '100%', // ���ø߶�Ϊ???�ڵĸ�??
                                    }}
                                >
                                    <IconArticle size='extra large' />  
                                    <p style={{ fontSize: '32px',  marginBottom: '10px' }}>ʶ��ԭ����</p>
                                    <p style={{ fontSize: '32px', marginTop: '0'}}>��???ʶ??���׼ȷ��ԭ</p>
                                </div>):(<div
                                    style={{
                                        position: 'absolute',
                                        top: '0',
                                        bottom: '0',
                                        left: '50.6%',
                                        right: '-5px',
                                        width: '49%',
                                        height: '100%', // �ϲ���ռ??9
                                        overflow: 'auto', // ��ӹ���??
                                        outline: 'none', // ȥ��Ĭ???�ľ۽���???
                                        // backgroundColor: 'white', // ��ӷֽ�??
                                    }}
                                    id="demo"
                                    ref={editableRef}
                                    contentEditable={true}
                                    onBlur={handleBlur}
                                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                                >
                                </div>)) : (
                                // ʶ��??״??
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '0',
                                        bottom: '0',
                                        left: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '49%',
                                        height: '100%',
                                        overflow: 'auto',
                                        outline: 'none',
                                    }}
                                >
                                    <Spin tip="ʶ��??" spinning={true}>
                                    </Spin>
                                </div>
                            )}
                        </div>
                         {/* ����?? */}
                        <Draggable
                            onDrag={handleDrag3}
                        >
                            <Card 
                                shadows='always'
                                style={{ maxWidth: 1000,
                                    position: 'absolute', // ʹ�þ�???��??
                                    left: '25%', // ����?? div �����Ե������� div ����??----���Գ���??20%
                                    width:'50%',
                                    bottom: '0', // ����?? div �ĵײ���??��???�� div �ĵ�??
                                    transform: 'translate(50%)', // ʹ�� transform ����ʹ�ڲ� div ˮƽ����
                                    zIndex: '999', // ?? z-index ����Ϊ�ϸߵ�??
                                }} 
                                bodyStyle={{ 
                                    display: 'flex',
                                    height:'10px',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    
                                }}
                            >
                                <Tooltip title='�����ı���???' arrow>
                                    <Button type="secondary"onClick={resetMode1} style={{backgroundColor:'white'}}><div style={{fontSize: '25px'}}><IconFontColor size='extra large' /></div></Button>
                                </Tooltip>
                                <Tooltip title='�����ı�����' arrow>
                                    <Button type="secondary"onClick={resetMode2} title='�����ı�����' style={{backgroundColor:'white'}}><div style={{fontSize: '25px'}}><IconMark size='extra large' /></div></Button>
                                </Tooltip>
                                <Tooltip title='����µ��ı���Ϣ' arrow>
                                    <Button type="secondary"onClick={handleAdd} title='����µ��ı���Ϣ' style={{backgroundColor:'white'}}><div style={{fontSize: '25px'}}><IconPlus size='extra large' /></div></Button>
                                </Tooltip>
                                {/* <Tooltip title='??�Ŷ���??:0-1֮��' arrow  
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}>
                                    <input
                                        id="inputValue"
                                        defaultValue=""
                                        // placeholder="??�Ŷ���??:0-1֮��"
                                        type="text"
                                        className="placeholder-style"
                                        style={{
                                            padding: '8px',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            outline: 'none',
                                            width: '60px',
                                        }}
                                        onChange={saveInputValue}
                                        value={confidenceThres}
                                    />
                                    
                                </Tooltip> */}
                                <div style={{ width: 200, marginRight: 15 }} onMouseDown={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}>
                                        <Slider tipFormatter={v => (`??�Ŷ�${v}%`)} getAriaValueText={v => (`${v}%`)} onChange={value=>setconfidenceThres(value/100)}/>
                                </div>
                                <Tooltip title='??�Ŷ���??:0-1֮��' arrow>
                                <InputNumber onChange={(v) => setconfidenceThres(v/100)} style={{ width: 100 }} value={confidenceThres*100} min={0} max={100} />
                                </Tooltip>
                                
                                <Tooltip title='����Ϊpng/jpg' arrow>
                                    <Button type="secondary" onClick={downloadImgFile} style={{ marginLeft: '100px', backgroundColor:'white'}}>
                                        <div style={{fontSize: '25px'}}><FileImageOutlined /></div>
                                    </Button>
                                </Tooltip>
                                <Tooltip title='����Ϊpdf' arrow>
                                    <Button type="secondary"onClick={downloadPDFFile} style={{backgroundColor:'white'}}>
                                        <div style={{fontSize: '25px'}}><FilePdfOutlined /></div>
                                    </Button>
                                </Tooltip>
                                <Tooltip title='����Ϊpdf' arrow>
                                    <Button type="secondary"onClick={downloadPDFFile} style={{backgroundColor:'white'}}>
                                        <div style={{fontSize: '25px'}}><FileWordOutlined /></div>
                                    </Button>
                                </Tooltip>
                            </Card>
                        </Draggable>
                        </div>
                        
                   
                    {/* �ϴ�/���ͼƬ���� */}
                    
                    <div
                        style={{
                            borderRadius: '10px',
                            border: '1px solid var(--semi-color-border)',
                            height: '18%',
                            padding: '2px 15px',
                            paddingLeft: '20px', // ���??
                            paddingRight: '20px', // �ұ�??
                            backgroundColor: 'white'
                        }}
                    >
                        <div
                            style={{
                                flex: '9', // �ϲ���ռ??9
                                backgroundColor: 'white', // �ϲ���͸��
                                // display: 'flex', 
                                // alignItems: 'center',
                            }}
                        >
                            {/* �ϲ�����?? */}
                            <Spin tip="�ϴ�??..." spinning = {isUpload}>
                                <Upload 
                                    action='https://api.semi.design/upload'
                                    listType="picture" 
                                    showPicInfo
                                    multiple 
                                    style={{ marginTop: 10 }}
                                    file={file}
                                    onChange={imageUpload}
                                    onPreviewClick={imageSelect}
                                    onRemove={imageRemove}
                                    className={{ marginTop: 10, height: '10%', flex: 1 }}
                                >
                                    <IconPlus size="extra-large" />
                                </Upload>
                            </Spin>
                        </div>
                        
                    </div>
                    
                   {/* </div> */}

            </Content>
           {/* β������ */}
            <Footer
                style={{
                    // position: 'fixed',
                    // bottom: '0',
                    width: '100%',
                    height: '35px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '20px',
                    alignItems: 'center', // ��ֱ����
                    color: 'var(--semi-color-text-2)',
                    backgroundColor: 'rgba(var(--semi-grey-0), 1)',
                }}
            >
                <span
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <IconBytedanceLogo size="large" style={{ marginRight: '8px' }} />
                    <span> created by Yz&SS </span>
                </span>
                <span>
                    <span style={{ marginRight: '24px' }}>ƽ̨�ͷ�</span>
                    <span>��???��??</span>
                </span>
            </Footer>

            {/* ??���ܵ�????��ť */}
            <Draggable
                defaultPosition={questionPosition}
                onDrag={handleDrag2}
                // onStop={handleQDragStop}
                // bounds={bounds}
            >
                <div style={{ 
                    cursor: 'move', 
                    // ??���ܲ����������
                    // zIndex:9999, 
                    }}>
                {/* <Tooltip title='??���??' arrow placement='left' > */}
                    <FloatButton.Group 
                        onClick={change}
                        trigger='click'
                        type="primary"
                        icon={ <CustomerServiceOutlined /> }
                        // style={{
                        //     zIndex: 9999,
                        // }} 
                        >
                    </FloatButton.Group>
                {/* </Tooltip> */}
                </div>
            </Draggable>
            
            {/* ??�Ĵ�?? */}
            {/* �̶��߶� */}
            <SideSheet title="????" visible={visible} onCancel={handleCancel} placement='bottom' height={600}>
                {/* ���ֺ͹�?? */}
                {visible && ocrData[highlightIndex].type != 'table'&&(
                    <div style={{ display: 'flex',  height:'85%', width:'100%'}}>
                    <div style={{display: 'flex',  height:'85%', width:'90%', alignItems: 'center', justifyContent: 'center',}}>
                         {/* ���ֱ�???��ʾ��?? */}
                         <div style={{ height: '100%', width: '15%', }}>
                             <div style={{height:'50%', alignItems: 'center', justifyContent: 'center',}}>
                                 <p style={{marginLeft:'20px', color: 'black', fontSize: '17px', height: '50%', padding: '10px 0 0 0', margin: '0', }}>ͼƬ��???��</p>
                             </div>
                             {currentIndex != -1 && highlightIndex != -1? (
                                     <div style={{height:'50%', alignItems: 'center', justifyContent: 'center',}}>
                                     <p style={{marginLeft:'20px',  color: 'black', fontSize: '17px', height: '50%', padding: '10px 0 0 0', margin: '0', }}>Latex��Ⱦ??</p>
                                 </div>
                                     ) :
                                     null}
                             
                             <div style={{height:'50%', alignItems: 'center', justifyContent: 'center',}}>
                                 <p style={{marginLeft:'20px',  color: 'black', fontSize: '17px', height: '50%', padding: '10px 0 0 0', margin: '0', }}>ʶ���ı�??</p>
                             </div>
                         </div>
                         {/* ͼƬ+�����ı�?? */}
                         <div style={{height: '100%', width: '70%', alignItems: 'center', justifyContent: 'center',}}>
                             <div style={{height:'50%', alignItems: 'center', justifyContent: 'center',}}>
                                     <div
                                         id="show-part-picture" 
                                         style={{ padding: '10px' }}
                                     >
                                     </div>
                                     
                             </div>
                             {currentIndex != -1 && highlightIndex != -1 ? (
                                     <div style={{height: '50%', alignItems: 'center', justifyContent: 'center', width:'90%'}}>
                                         <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '20px'}}>
                                             <InlineMath >{text}</InlineMath>
                                         </div>
                                     </div>
                                     ) :
                                     null}
                             <div style={{height:'50%', alignItems: 'center', justifyContent: 'center',}}>
                                 {/* ��???����??? */}
                                 {/* <input id='modified' type="text" className="ocr-input" value={text} onChange={handleSelectionChange} style={{ width: '600px', fontSize:'16px', height:'28px', outline: 'none' }}/> */}
                                 {/* ��???����??? */}
                                 <textarea id="modified" className="ocr-input" value={text} onChange={handleSelectionChange} style={{ width: '90%', fontSize:'16px', outline: 'none' }} rows={4} />
                             </div>
                         </div>
                     </div>
                     {/* ����?? */}
                     <div style={{ display: 'flex', bottom: '0', width: '10%', flexDirection: 'column',}}>
                         <div style={{height: '82%',}}></div>
                         <div style={{ height: '18%',}}>
                             <Button
                                 onClick={() => handleDec()}
                                 style={{
                                     margin: '10px 40px',
                                     fontSize: '20px', // �����ı���С
                                     padding: '15px 15px', // ������ť��???
                                     color: '#fff',
                                     borderColor: '#2e6ff6',
                                     background: '#2e6ff6',
                                     textShadow: '0 -1px 0 rgba(0,0,0,.12)',
                                     boxShadow: '0 2px rgba(0,0,0,.043)',
                                     alignSelf: 'flex-end', // ����??���뵽��??
                                 }}>ɾ��</Button>
 
                             <Button
                                 onClick={() => handleOk()}
                                 style={{
                                     margin: '10px 40px',
                                     fontSize: '20px', // �����ı���С
                                     padding: '15px 15px', // ������ť��???
                                     color: '#fff',
                                     borderColor: '#2e6ff6',
                                     background: '#2e6ff6',
                                     textShadow: '0 -1px 0 rgba(0,0,0,.12)',
                                     boxShadow: '0 2px rgba(0,0,0,.043)',
                                     alignSelf: 'flex-end', // ����??���뵽��??
                                 }}>????</Button>
                         </div>
                     </div>               
                 </div>
                )}
                {/* ��� */}
                {visible && ocrData[highlightIndex].type === 'table'&&(
                    // �ܵ�����
                    <div style={{display: 'flex', height: '95%', width:'100%'}}>
                        {/* �����ʾԭͼ?? */}
                        <div style={{height: '100%', width:'45%'}}>
                            <p style={{marginLeft:'20px', color: 'black', fontSize: '17px', height:'10%', padding: '10px 0 0 0', margin: '0', }}>ͼƬ��???��</p>
                            <div style={{height:'90%', alignItems: 'center', justifyContent: 'center',}}>
                                <div
                                    id="show-part-picture" 
                                    style={{ padding: '10px' }}
                                >
                                </div>          
                            </div>
                        </div>
                        {/* �Ҳ���ʾ��Ⱦ��� */}
                        <div style={{height: '100%', width:'45%'}}>
                            <p style={{marginLeft:'20px', color: 'black', fontSize: '17px', height:'10%', padding: '10px 0 0 0', margin: '0', }}>�����Ⱦ??</p>
                            <div style={{height:'90%', alignItems: 'center', justifyContent: 'center',}}>
                                 <div
                                    ref={tableEditableRef}
                                    contentEditable={true}
                                    onBlur={handleBlur_table}
                                    dangerouslySetInnerHTML={{ __html: htmlContent_table }}
                                ></div>
                            </div>
                        </div>
                        {/* ���Ҳ���ʾ��ť */}
                        <div style={{height: '100%', width:'10%'}}>
                            <div style={{height: '60%',}}></div>
                            <div style={{height: '40%'}}>
                                {/* ���������???�������У��У�ɾ���С��еİ�?? */}
                                <Button
                                    onClick={()=>{setHtmlContent_table(addRow(htmlContent_table))}}
                                    style={{
                                        margin: '10px 40px',
                                        fontSize: '20px', // �����ı���С
                                        padding: '15px 15px', // ������ť��???
                                        color: '#fff',
                                        borderColor: '#2e6ff6',
                                        background: '#2e6ff6',
                                        textShadow: '0 -1px 0 rgba(0,0,0,.12)',
                                        boxShadow: '0 2px rgba(0,0,0,.043)',
                                        alignSelf: 'flex-end', // ����??���뵽��??
                                    }}>��???</Button>
                                <Button
                                    onClick={()=>{setHtmlContent_table(addColumn(htmlContent_table))}}
                                    style={{
                                        margin: '10px 40px',
                                        fontSize: '20px', // �����ı���С
                                        padding: '15px 15px', // ������ť��???
                                        color: '#fff',
                                        borderColor: '#2e6ff6',
                                        background: '#2e6ff6',
                                        textShadow: '0 -1px 0 rgba(0,0,0,.12)',
                                        boxShadow: '0 2px rgba(0,0,0,.043)',
                                        alignSelf: 'flex-end', // ����??���뵽��??
                                    }}>����</Button>
                                <Button
                                    onClick={() => handleDec()}
                                    style={{
                                        margin: '10px 40px',
                                        fontSize: '20px', // �����ı���С
                                        padding: '15px 15px', // ������ť��???
                                        color: '#fff',
                                        borderColor: '#2e6ff6',
                                        background: '#2e6ff6',
                                        textShadow: '0 -1px 0 rgba(0,0,0,.12)',
                                        boxShadow: '0 2px rgba(0,0,0,.043)',
                                        alignSelf: 'flex-end', // ����??���뵽��??
                                    }}>ɾ��</Button>

                                <Button
                                    onClick={() => handleOk()}
                                    style={{
                                        margin: '10px 40px',
                                        fontSize: '20px', // �����ı���С
                                        padding: '15px 15px', // ������ť��???
                                        color: '#fff',
                                        borderColor: '#2e6ff6',
                                        background: '#2e6ff6',
                                        textShadow: '0 -1px 0 rgba(0,0,0,.12)',
                                        boxShadow: '0 2px rgba(0,0,0,.043)',
                                        alignSelf: 'flex-end', // ����??���뵽��??
                                    }}>????</Button>
                            </div>
                        </div>
                    </div>
                )}

            </SideSheet>
           {/* ??ʽ???��������ʾ����??��ť----??�϶� */}
           {visible &&ocrData[highlightIndex].type != 'table'&& (
                <Draggable defaultPosition={formulaPosition} onDrag={handleDrag1}>
                    <div style={{ cursor: 'move', zIndex: 9999 }}>
                    <Formula handleSymbolClick={handleSymbolClick} />
                    </div>
                </Draggable>
            )}
            {/* ??���ܴ�?? */}
            <SideSheet title="??��??" visible={chatVisible} onCancel={change} style={{width:'30%', height:'100%'}}>
                <ChatBox messages={messages} setMessages={setMessages} data={dataList} />
            </SideSheet>
            {/* ����ı����� */}
            {/* <Draggable
                defaultPosition={annotatorPosition}
                onDrag={handleDrag4}> */}
                <div 
                    style={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)', 
                        zIndex:"9997"
                    }}>
                    {showImageAnnotator && (
                    
                        <ImageAnnotator image={file[currentIndex].url} onClose={handleImageAnnotatorClose} />
                    
                    )}
                </div>
            {/* </Draggable> */}
        </Layout>
    );
};

export default App;