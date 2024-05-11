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
import Draggable from 'react-draggable'; // react拖拽功能
import DraggableDivider from  './components/DraggableDivider'
import { SideSheet, Upload, Spin,Card } from '@douyinfe/semi-ui';
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
    const [currentIndex, setCurrentIndex] = useState(-1);  //当前识别的图片编号
    const [rectangleList, setRectangleList] = useState([]) //矩形信息
    const [isUpload,setIsUpload] = useState(false);  //上传中判断
    const [file, setFile] = useState([]);  // 图片列表
    const [dataList, setDataList] = useState([])    //记录所有识别数据
    const [ocrData, setOcrData] = useState(null);   //目前版本还原的文本数据
    const [confidenceThres, setconfidenceThres] = useState(1) //置信度阈值
    const [showImageAnnotator, setShowImageAnnotator] = useState(false); //图片标注界面


    // 设置下栏点击的图片下标
    const [selectIndex, setSelectIndex] = useState(-1);
    // 用于处理dataList改变无法及时被检测的问题
    const [dataListLoading, setDataListLoading] = useState(false);
    const [imageNum, setImageNum] = useState(0);  //目前正在识别的图片数目
    const [currentOcr, setCurrentOcr] = useState(false); // 是否显示识别中
    const [picRatio,setPicRatio] = useState(null);

    //处理添加按钮点击事件-----排除处理未有识别数据
    const handleAdd = () => {
        if(!currentOcr) {
            if(file!=null) {
                setShowImageAnnotator(true);
            } else {
                console.log("此时未上传图片！")
            }
        }
        
    }
    //处理添加标注回调函数
    const handleImageAnnotatorClose = (annotatedData) => {
        console.log("添加回调");
        console.log(annotatedData);
        if (annotatedData.text!=[] && annotatedData.rectangles!=[]) {
        //添加具体处理标注数据操作
        //将新增的矩形坐标和文本数据加入
            const score = 1;
            const position = annotatedData.rectangles;
            const text = annotatedData.text;
            const type = "text";
            const dataObj = {position,score,text,type};
            dataList[currentIndex].data.push(dataObj);
            ocrData.push(dataObj);
            htmlFlash(ocrData)
        }
        //关闭界面
        setShowImageAnnotator(false);
    }


    //----------------储存置信度阈值函数-------------------
    const saveInputValue = () => {
        let inputValue = document.getElementById("inputValue").value;
        setconfidenceThres(inputValue);
        console.log("显示设置的阈值：", inputValue);
    }
   
    //文本标记方式按键参数
    const [model1,setModel1]= useState(false)
    const [model2,setModel2]= useState(false)
    // 高亮标记
    const [highlightIndex,setHighlightIndex] = useState(-1)

    // 高亮模式---排除处理未有识别数据
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

    // 图像显示画布
    const canvasRef = useRef(null);

    //高亮点击事件
    const highLight = (event) => {
        if(dataList[currentIndex].data!=undefined) {
            let rect = canvasRef.current.getBoundingClientRect();
            // 获取鼠标点击的位置信息
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
                // 将矩形位置的像素数据绘制
                newCtx.putImageData(rectangle.tempPartImage, 0, 0);
                drawImageAndRectangle(file[currentIndex],dataList[currentIndex].data,model1,model2,index);
                // 考虑修改窗口的显示
                if (highlightIndex == index){
                     // 设置默认的公式提示位置
                    setFormulaPosition({ x: -40, y: -200 });
                    // 获取弹窗容器元素
                    showDialog(index,function() {
                        // 延迟执行回调函数
                        setTimeout(function() {
                            // 获取弹窗容器元素
                            const dialogElement = document.getElementById('show-part-picture');
                            // 将新的Canvas元素添加为弹窗容器元素的子节点
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
                setHighlightIndex(-1); //取消高亮标记
                drawImageAndRectangle(file[currentIndex],dataList[currentIndex].data,model1,model2,index); // 重新调用绘制函数
            }
        }
        
    }
    // 对图片进行高亮绘制--矩形或矩形框
    // flag3是高亮标，flag1、flag2是不同的高亮模式
    function drawImageAndRectangle (file,data=undefined,flag1 = 0,flag2 = 0,flag3 = -1){
        // console.log("file:", file)
        const blobUrl = URL.createObjectURL(file.fileInstance);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const image = new Image();
        image.src = blobUrl;
        let rectangles = [];
        image.onload = () => {
            // 获取图片的实际宽度和高度
            const imageWidth = image.width;
            const imageHeight = image.height;
            // 计算缩放比例，以确保图片按照固定比例进行显示
            // 这里初始以容器的宽和高来设置
            // 这里是固定了最大宽高为1000、600的，后期可改
            const ratio = imageHeight/imageWidth;
            const displayWidth = imageRef.current.clientWidth;
            const displayHeight = ratio*imageRef.current.clientWidth;
        
             // 修改图片对象的宽度和高度属性
            image.width = displayWidth;
            image.height = displayHeight;
        
            // 设置 canvas 的宽度和高度与图片的显示宽度和高度一致
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            // 绘制图片到 canvas
            ctx.drawImage(image, 0, 0, displayWidth, displayHeight);
            // 没有数据的时候绘制图片
            if(data!==undefined) {
                //提取坐标和精确度渲染
                 let rectangles = [];
                 console.log(data)
                 data.map((item, index) => {
                     const { position, score,text, type, } = item;
                     const coordinateList = position;
                     //左上x
                     const x1 = coordinateList[0][0];
                     //左上y
                     const y1 = coordinateList[0][1];
                     //右上x
                     const x2 = coordinateList[1][0];
                     //左下y
                     const y4 = coordinateList[3][1];
                     //长 = 右上x - 左上x
                     const width = (x2 - x1) * image.width
                     //高 = 左下y - 左上x
                     const height = (y4 - y1) * image.height
                     //x
                     const x = x1 * image.width
                     //y
                     const y = y1 * image.height  
                     // 每个矩形数据都存储其对应截图
                     const tempPartImage = ctx.getImageData(x, y, width, height)
                     const rItem = { x, y, width, height, index, tempPartImage}
                     rectangles.push(rItem)
                     // 画矩形
                     if(flag2){
                         ctx.fillStyle ='rgb(110, 175, 230, 0.4)';
                         ctx.fillRect(x, y, width, height);
                         ctx.font = '14px Arial';  // 设置字体大小和字体样式
                         ctx.fillStyle = 'rgb(35, 105, 240)';
                         ctx.fillText(`${index}`, x, y);  // 在位置(x,y)绘制文本数字1
                     }
                     if(index == flag3){
                         ctx.fillStyle ='rgb(250, 60, 32, 0.4)';
                         ctx.fillRect(x, y, width, height);
                         ctx.font = '14px Arial';  // 设置字体大小和字体样式
                         ctx.fillStyle = 'rgb(35, 105, 240)';
                         ctx.fillText(`${index}`, x, y);  // 在位置(x,y)绘制文本数字1
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
                                const fontSize = newHeight/1.3 ;
                                style =`  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px; left: ${position[0][0] * 100}%; width:${width}px;font-size: ${fontSize}px`;
                            }else{
                                var fontSize = (position[3][1]-position[0][1])*picRatio*editableRef.current.clientWidth;
                                fontSize = fontSize/1.3
                                if (type == 'formula'){
                                    style =`  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px; left: ${position[0][0] * 100}%;`;
                                }else{
                                    style =`  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px; left: ${position[0][0] * 100}%;`;
                                }
                                renderedText =  renderLaTeX(text);
                            }
                            fontSize = (position[0][1]-position[3][1])*picRatio*editableRef.current.clientWidth;
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
                         ctx.font = '14px Arial';  // 设置字体大小和字体样式
                         ctx.fillStyle = 'rgb(35, 105, 240)';
                         ctx.fillText(`${index}`, x, y);  // 在位置(x,y)绘制文本数字1
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

   //---------------版面还原-----------------
    
    const [htmlContent, setHtmlContent] = useState(`
    
    <div style="color: gray; display: flex; justify-content: center; align-items: center; flex-direction: column; margin-top: 200px;">
        <p style="font-size: 32px;">识别还原区域</p>
        <p style="font-size: 32px;">针对识别结果准确还原</p>
    </div>    
    `);
    const [htmlContent_demo, setHtmlContent_demo] = useState(`
    <div style="color: gray; display: flex; justify-content: center; align-items: center; flex-direction: column; margin-top: 200px;">
        <p style="font-size: 32px;">图片显示区域</p>
        <p style="font-size: 32px;">点击下方添加按键添加图片</p>
    </div>    
    `);
    const [htmlContent_table, setHtmlContent_table] = useState(``);
    const [htmlContent_formula, setHtmlContent_formula] = useState(``);
    const editableRef = useRef(null);
    const tableEditableRef = useRef(null);
    const imageRef = useRef(null);
    //latex转公式
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
                    const fontSize = newHeight/1.3 ;
                    style =`  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px; left: ${position[0][0] * 100}%; width:${width}px;font-size: ${fontSize}px`;
                }else{
                    var fontSize = (position[3][1]-position[0][1])*picRatio*editableRef.current.clientWidth;
                    fontSize = fontSize/1.3
                    if (type == 'formula'){
                        style =`  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px; left: ${position[0][0] * 100}%;`;
                    }else{
                        style =`  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px; left: ${position[0][0] * 100}%;`;
                    }
                    renderedText =  renderLaTeX(text);
                }
                fontSize = (position[0][1]-position[3][1])*picRatio*editableRef.current.clientWidth;
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
                const fontSize = newHeight/1.3 ;
                style =`  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px; left: ${position[0][0] * 100}%; width:${width}px;font-size: ${fontSize}px`;
            }else{
                var fontSize = (position[3][1]-position[0][1])*picRatio*editableRef.current.clientWidth;
                fontSize = fontSize/1.3
                if (type == 'formula'){
                    style =`  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px; left: ${position[0][0] * 100}%;`;
                }else{
                    style =`  position: absolute; top: ${position[0][1] * picRatio*editableRef.current.clientWidth}px; left: ${position[0][0] * 100}%;`;
                }
                renderedText =  renderLaTeX(text);
            }
            fontSize = (position[0][1]-position[3][1])*picRatio*editableRef.current.clientWidth;
            // return `<div style="${style}" data-type="${type}">${renderedText}</div>`;
            return `<div style="${style} ;" data-type="${type}">${renderedText}</div>`;
            
        }).join('');
        setHtmlContent(html);
    }
    // 监听htmlContent的变化，每当htmlContent更新时，重新渲染组件
    useEffect(() => {
        // 在这里可以执行与htmlContent有关的其他逻辑
    }, [htmlContent]);
    
    // 处理内容编辑完成后的事件
    const handleBlur = () => {
        // 获取可编辑元素的当前内容
        const editedHtml = editableRef.current.innerHTML;
        setHtmlContent(editedHtml);

        // 更新 OCR 数据
        let updatedOcrData = { ...ocrData };
        updatedOcrData= Array.from(editableRef.current.children).map((element,index)=> {
            const type = element.getAttribute('data-type');
            const position =ocrData[index].position;
            // const length = ocrData[index].text.length; 
            // console.log("长度对比:",length,"文本",element.innerText.length)
            const elementText = element.innerText;
            let newlineIndex = -1;
            for (let i = elementText.length - 1; i >= 0; i--) {
                if (elementText[i] === '\n') {
                    newlineIndex = i;
                    break; // 找到第一个换行符后停止循环
                }
            }
            let Text = null
            if (newlineIndex !== -1) {
                Text = elementText.substring(newlineIndex + 1); // 截取换行符后面的部分
            } else {
                console.log("未找到换行符");
            }
            let text;
            if (type === "table") {
                text = element.innerHTML;
            } else if (type === "formula") {
                console.log("formula:",element.innerText);
                text = ocrData[index].text;
            } else {
                text = Text; // 这里的 Text 是你原来代码中的变量，保留了原逻辑
            }
            const score = ocrData[index].score;
            return { position, text, type,score };
        });
        const currentDataList = [...dataList]; 

        // 修改索引为 0 的元素
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
    //-------------图片选择和前后端交互---------------
    // 将图片的 URL 转换成文件
    async function urlToBlob(url) {
      const response = await fetch(url);
      const blob = await response.blob();
      return blob;
    }
    
    //下栏图片点击事件
    function imageSelect(File){
        setModel1(false);
        setModel2(false);
        console.log("当前点击", File);
        file.forEach((item, index)=>{
            if(item.url == File.url){
                // console.log("保存点击下标", index);
                // setSelectIndex(index);
                setCurrentIndex(index);
                console.log("下标：", index);
                console.log("数据", dataList[index].data);
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
                    setCurrentOcr(true); // 设置为识别中
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
    // 辅助函数，计算文件大小
    function calculateFileSize(size) {
        const KB = size / 1024; // 将字节转换为KB
        return KB.toFixed(2); // 保留两位小数
    }

    async function createFileInstanceFromUrl(url) {
        try {
           // 使用 fetch 获取 URL 指向的资源
          const response = await fetch(url);
          const blob = await response.blob(); //将响应数据转换为 Blob 对象
      
          // 创建一个新的 File 对象，将 Blob 对象作为参数传递给构造函数
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
            // console.log("目前正在识别的文件：", currentFile);
            imageOCR(currentFile);
            setImageNum(imageNum+1);
          }
           // 更新 imageNum 的值，以便下次触发时从正确的位置开始处理
          setImageNum(file.length);
        }
      }, [file, imageNum]);
    
    
    useEffect(() => {
        if(currentIndex!=-1 &&dataList[currentIndex].data!==undefined){
            setCurrentOcr(false);
            drawImageAndRectangle(file[currentIndex], dataList[currentIndex].data);
        }
    }, [dataList, currentIndex]);
    
    // 上传事件
    const  imageUpload = async ({ fileList, currentFile, event }) => {
        setIsUpload(true);
        console.log("上传组件调用：", fileList);
        // 先创建一个和fileList相同长度的dataList
        const tempDataList = fileList.map(file => {
            const dataObj = dataList.find(data => data.url === file.url);
            return {
              url: file.url,
              data: dataObj ? dataObj.data : undefined
            };
          });

        const fileExtension = fileList[fileList.length-1].name.split('.').pop();
        // pdf文件上传处理
        if (fileExtension.toLowerCase() == "pdf") {
            // pdf拆成图片加入file中
            try {
                    //const imageUrls = await Pdf2Images(fileList[fileList.length-1].url);
                    const response = await axios.get(fileList[fileList.length-1].url, {
                        responseType: 'blob', // 设置响应类型为Blob
                    });
                    const blob = response.data; // 获取PDF文件的Blob对象
                    // 异步处理
                    const arrayBuffer = await blob.arrayBuffer(); 
                    const pdf = await pdfjs.getDocument({
                        data: arrayBuffer,}).promise; // 获取PDF文档对象

                    const numPages = pdf.numPages; // 获取PDF文档的总页数
                    // const imageUrls = [];
                    const name = `${fileList[fileList.length-1].name}`
                    console.log(numPages);
                    // 移除pdf对象，后续替换成每张图片
                    fileList.pop();
                    tempDataList.pop();
                    for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
                        const page = await pdf.getPage(pageNumber); // 获取PDF的每一页
                    
                        const viewport = page.getViewport({ scale: 1.5 }); // 获取页面的视口
                    
                        const canvas = document.createElement('canvas'); // 创建canvas元素
                        const context = canvas.getContext('2d'); // 获取2d绘图上下文
                    
                        canvas.width = viewport.width; // 设置canvas的宽度
                        canvas.height = viewport.height; // 设置canvas的高度
                    
                        const renderContext = {
                          canvasContext: context,
                          viewport: viewport
                        };
                    
                        await page.render(renderContext).promise; // 将页面渲染到canvas上
                    
                        const dataUrl = canvas.toDataURL('image/png'); // 将canvas转换为data URL
                        const b = dataURLtoBlob(dataUrl);
                        const imageUrl = URL.createObjectURL(b);
                        const fileName = `${name}_${pageNumber}.png`; // 设置文件名
                        const fileSize = calculateFileSize(b.size); // 计算文件大小
                        const path = imageUrl; // 设置图片URL
                        const fileInstance = await createFileInstanceFromUrl(imageUrl);

                        // 将图片URL添加到数组中
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
                        //fileList.push(fileList[fileList.length-1]); // 将图片URL添加到数组中
                    }
                    setFile(fileList);  
                    setDataList(tempDataList);
              } catch (error) {
                console.error('Error processing PDF:', error);
              }
        } else {
            // 文件类型为图片
            setFile(fileList);
            setDataList(tempDataList);
        }
        setIsUpload(false);
    };

    // 移除的回调函数---目前没用
    const imageRemove = async ({fileList}) => {
        // console.log("移除文件的回调：", imageNum-1);
        // setImageNum(imageNum-1);

    }

    // 识别函数
    // imageNum---控制识别的图片下标
    async function imageOCR2 (File){
        // setIsUpload(true);
        console.log("目前图片列表长度：", File.length)
        console.log("调用识别一次！")
        const formData = new FormData();
        // 一次只识别一张
        if(File.length-imageNum > 0) {
            const url = File[imageNum].url;
            console.log("待识别图片的url:", url);
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
            fetch(' http://127.0.0.1:5000/one-image', {
                method: 'POST',
                body: formData,
                mode: 'cors',
            })
            //解析后端返回数据
            .then(response => response.json())
            .then(Data => {
                // console.log("返回数据：",Data['OCR_data']);
                Data['OCR_data'].forEach(function(item,index) {
                    // 在此处对每个项执行操作
                    // 排序
                    const data = [...Data].sort((a, b) => {
                        // 确保 a 和 b 的 position 存在
                        if (a.position && b.position) {
                        // 确保 position 中的第一个元素存在
                        if (a.position[0] && b.position[0]) {
                            // 比较纵坐标
                            if (a.position[0][1] < b.position[0][1]) {
                            return -1;
                            } else if (a.position[0][1] > b.position[0][1]) {
                            return 1;
                            } else {
                            // 如果纵坐标相等，则比较横坐标
                            if (a.position[0][0] < b.position[0][0]) {
                                return -1;
                            } else if (a.position[0][0] > b.position[0][0]) {
                                return 1;
                            } else {
                                return 0; // 如果横坐标也相等，返回0
                            }
                            }
                        }
                        }
                        return 0; // 默认返回0，可以根据具体情况调整
                    });
                    const url = File[imageNum+index].url
                    // console.log(data);
                    const dataObj = { url, data };
                    // 默认显示第一张图片和信息的操作
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
                console.error('发生错误：', error);
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
            fetch('https://8026-222-212-86-164.ngrok-free.app/one-image', {
                method: 'POST',
                body: formData,
                mode: 'cors',
            })
            //解析后端返回数据
            .then(response => response.json())
            .then(Data => {
                // 排序
                const data = [...Data].sort((a, b) => {
                    // 确保 a 和 b 的 position 存在
                    if (a.position && b.position) {
                        // 确保 position 中的第一个元素存在
                        if (a.position[0] && b.position[0]) {
                        // 比较纵坐标
                        if (a.position[0][1] < b.position[0][1]) {
                            return -1;
                        } else if (a.position[0][1] > b.position[0][1]) {
                            return 1;
                        } else {
                            // 如果纵坐标相等，则比较横坐标
                            if (a.position[0][0] < b.position[0][0]) {
                            return -1;
                            } else if (a.position[0][0] > b.position[0][0]) {
                            return 1;
                            } else {
                            return 0; // 如果横坐标也相等，返回0
                            }
                        }
                        }
                    }
                    return 0; // 默认返回0，可以根据具体情况调整
                });

                for(let i=0; i<dataList.length; i++) {
                    if(dataList[i].url===url) {
                        dataList[i].data = data;
                        break;
                    }
                }
                setDataList(dataList);
                console.log("识别后的dataList:", dataList);
                setDataListLoading(true);
                // // 默认显示第一张图片和信息的操作
                // if(url==file[0].url){
                //     drawImageAndRectangle(file[0], data);
                //     setCurrentIndex(0);
                //     setCurrentOcr(false);
                //     setOcrData(data);
                // }
                // dataList.push(dataObj);
            })
        } catch (error) {
            console.error('发生错误：', error);
        }
    }


    // 监测dataList的变化以获取数据之后更新版面还原信息
    useEffect(() => {
        setDataListLoading(false);
        console.log("监测到dataListLoading变化")
        console.log("dddddd", dataList)
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
            // 设置当前图片为识别中
            setCurrentOcr(true);
        }
    }, [dataListLoading, currentIndex]);


    //功能实现————弹窗实现
    const [visible, setVisible] = useState(false);
    const [text, setText] = useState('');

    // 修改弹窗的出现--index，回调函数
    function showDialog(index,callback) {
        if(index != -1){
            setVisible(true);
            setText(ocrData[index].text);
            if(typeof callback === 'function'){
                callback();
            }
        }
    }
    
    // 内容修改的确定
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
            const newOcrData = [...ocrData]; // 创建 ocrData 的副本
            // 修改副本中 highlightIndex 处的 text 属性值
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
    // 删除某个内容
    const handleDec = () => {
        console.log("删除");
        // 若没有高亮，则index此时为-1
        if (highlightIndex != -1) {
          //更新currentTextList
            ocrData.splice(highlightIndex, 1);
            htmlFlash(ocrData)
          //更新dataList
          dataList[currentIndex].data.splice(highlightIndex, 1);
        }
        // 关闭弹窗
        handleCancel();
    }
    //问答功能实现
    const [messages, setMessages] = useState([
        {
          content: '你好，有什么可以帮助你的吗',
          sender: 'System',
          timestamp: new Date().toLocaleTimeString(),
          avatar: robotAvatar,
        },
      ]);
    const [chatVisible, setChatVisible] = useState(false);
    // 问答功能的点击事件
    const change = () => {
        setChatVisible(!chatVisible);
    };


    const downloadPDFFile = async () => {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const file = new File([blob], 'your_file.html', { type: 'text/html' });

        const formData = new FormData();
        formData.append('file', file);
        try {
            fetch('https://ce04-171-94-16-68.ngrok-free.app/convertToPdf', {
                    method: 'POST',
                    body: formData
                })
                //解析后端返回数据
                .then(response => response.json())
                
         
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };


    // 点击公式符号的函数
    const handleSymbolClick = (symbol) => {
        // 考虑修改窗口和版面还原窗口两个部分
        if (visible==true) {
            /// 此时定位到修改窗口
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
                // 如果为修改窗口，调用函数更新
                setText(newValue);
              } else {
                // 处理没有光标或没有文本区域的情况
              }
        }else{
            // 版面还原区域！
        }
        
        
      };

    // 拖拽标志
    const [isQuestionDragging, setIsQuestionDragging] = useState(false);
    const [isFormulaDragging, setIsFormulaDragging] = useState(false);
    const [isButtonDragging, setIsButtonDragging] = useState(false);
    // const [isAnnotatorDragging, setIsAnnotatorDragging] = useState(false);
    // 位置
    const [formulaPosition, setFormulaPosition] = useState({ x: -40, y: -200 });
    const [questionPosition, setQuestionPosition] = useState({ x: -50, y: -20 });
    const [buttonPosition, setButtonPosition] = useState({x: 0, y: 0});
    // const [annotatorPosition, setAnnotatorPosition] = useState({x: 0, y: 0});

    // 问答服务的拖拽函数
    const handleDrag2 = (e, ui) => {
        setIsQuestionDragging(true);
        // 获取拖动偏移量
        const { x, y } = ui;
        setQuestionPosition(prevPosition => ({
          x: prevPosition.x + x,
          y: prevPosition.y + y
        }));
    };
    
    //公式提示的拖拽函数
    const handleDrag1 = (e, ui) => {
        setIsFormulaDragging(true);
        // 获取拖动偏移量
        const { x, y } = ui;
        setFormulaPosition(prevPosition => ({
          x: prevPosition.x + x,
          y: prevPosition.y + y
        }));
    };
    // 按键区的拖拽函数
    const handleDrag3 = (e, ui) => {
        setIsButtonDragging(true);
        // 获取拖动偏移量
        const {x, y} = ui;
        setButtonPosition(prevPosition => ({
            x: prevPosition.x + x,
            y: prevPosition.y + y
        }));
    };
    // // 添加窗口的拖拽函数
    // const handleDrag4 = (e, ui) => {
    //     setIsAnnotatorDragging(true);
    //     // 获取拖动偏移量
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

            {/* 头部布局 */}
            <Header>
                <div>
                    <Nav mode="horizontal" defaultSelectedKeys={['Home']} style={{ backgroundColor: 'rgb(32,161,255)', height: '60px', boxShadow:'2px, 2px, 2px, rgba(194, 210, 255, .35)' }}>
                        {/* 图标 */}
                        <Nav.Header>
                            <IconFeishuLogo style={{  color: '#fff', height: '40px', fontSize: 40 }}/>
                        </Nav.Header>
                        {/* 功能键 */}
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
                               智能OCR
                            </span>
                        </span>
                        {/* 后部功能键 */}
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

            {/* 内容页 */}
            <Content
                    style={{
                        padding: '2px',
                        height: '80vh', 
                        backgroundColor: '#f0f0f0',
                        // overflowY: 'auto' 
                    }}
                >
                   {/* <div style={{height: '100%', width: '100%'}}> */}
                     {/* 展示区域 */}
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
                        {/* 中间分界线 */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '0',
                                left: '50%', // 在左右对半分
                                height: '100%',
                                width: '2px',// 分界线宽度
                                backgroundColor: 'transparent', // 将实线改为透明
                                borderLeft: '2px dashed grey', // 使用虚线样式
                                zIndex: '1', // 确保虚线在其他内容上方
                            }}
                        />


                        {/* 图片 */}
                        <div
                            style={{
                                width: '50%', // 左右对半
                                height: '100%', // 完全填充父容器
                                display: 'inline-block', // 行内块级元素
                                verticalAlign: 'top', // 顶部对齐
                            }}
                        >

                            {/* 图片区 */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '0',
                                    left: '0',
                                    width: '50%',
                                    height: '100%', // 上部分占比9
                                    backgroundColor: 'white', // 添加分界线
                                    overflow: 'auto', // 添加滚动条
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
                                        height: '100%', // 设置高度为视口的高度
                                    }}
                                >
                                    <IconImage size='extra large' />
                                    <p style={{ fontSize: '32px', marginBottom: '10px' }}>图片显示区域</p>
                                    <p style={{ fontSize: '32px', marginTop: '0' }}>点击下方添加按键添加图片</p>
                                </div>
                                    ) : null}
                                <canvas ref={canvasRef} className='image'  onClick={(e) => highLight(e)} />
                            </div>
                        </div>

                        {/* 版面还原 */}
                        <div
                            style={{
                                width: '50%', // 左右对半
                                height: '100%', // 完全填充父容器
                                display: 'inline-block', // 行内块级元素
                                verticalAlign: 'top', // 顶部对齐
                            }}
                        >
                            {/* 版面还原区 */}
                            {!currentOcr ?(
                                currentIndex === -1?(<div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '100px',
                                        color: 'gray',
                                        height: '100%', // 设置高度为视口的高度
                                    }}
                                >
                                    <IconArticle size='extra large' />  
                                    <p style={{ fontSize: '32px',  marginBottom: '10px' }}>识别还原区域</p>
                                    <p style={{ fontSize: '32px', marginTop: '0'}}>针对识别结果准确还原</p>
                                </div>):(<div
                                    style={{
                                        position: 'absolute',
                                        top: '0',
                                        bottom: '0',
                                        left: '50.6%',
                                        right: '-5px',
                                        width: '49%',
                                        height: '100%', // 上部分占比9
                                        overflow: 'auto', // 添加滚动条
                                        outline: 'none', // 去除默认的聚焦边框
                                        // backgroundColor: 'white', // 添加分界线
                                    }}
                                    id="demo"
                                    ref={editableRef}
                                    contentEditable={true}
                                    onBlur={handleBlur}
                                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                                >
                                </div>)) : (
                                // 识别中状态
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
                                    <Spin tip="识别中" spinning={true}>
                                    </Spin>
                                </div>
                            )}
                        </div>
                         {/* 按键区 */}
                        <Draggable
                            onDrag={handleDrag3}
                        >
                            <Card 
                                shadows='always'
                                style={{ maxWidth: 1000,
                                    position: 'absolute', // 使用绝对定位
                                    left: '25%', // 将内层 div 的左边缘放在外层 div 的中间----测试出来的20%
                                    width:'50%',
                                    bottom: '0', // 将内层 div 的底部放置于外层 div 的底部
                                    transform: 'translate(50%)', // 使用 transform 属性使内层 div 水平居中
                                    zIndex: '999', // 将 z-index 设置为较高的值
                                }} 
                                bodyStyle={{ 
                                    display: 'flex',
                                    height:'10px',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    
                                }}
                            >
                                <Tooltip title='高亮文本边框' arrow>
                                    <Button type="secondary"onClick={resetMode1} style={{backgroundColor:'white'}}><div style={{fontSize: '25px'}}><IconFontColor size='extra large' /></div></Button>
                                </Tooltip>
                                <Tooltip title='高亮文本矩形' arrow>
                                    <Button type="secondary"onClick={resetMode2} title='高亮文本矩形' style={{backgroundColor:'white'}}><div style={{fontSize: '25px'}}><IconMark size='extra large' /></div></Button>
                                </Tooltip>
                                <Tooltip title='添加新的文本信息' arrow>
                                    <Button type="secondary"onClick={handleAdd} title='添加新的文本信息' style={{backgroundColor:'white'}}><div style={{fontSize: '25px'}}><IconPlus size='extra large' /></div></Button>
                                </Tooltip>
                                <Tooltip title='置信度阈值:0-1之间' arrow>
                                    <input
                                        id="inputValue"
                                        defaultValue=""
                                        // placeholder="置信度阈值:0-1之间"
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
                                </Tooltip>
                                <Tooltip title='导出为png/jpg' arrow>
                                    <Button type="secondary" onClick={downloadPDFFile} style={{ marginLeft: '100px', backgroundColor:'white'}}>
                                        <div style={{fontSize: '25px'}}><FileImageOutlined /></div>
                                    </Button>
                                </Tooltip>
                                <Tooltip title='导出为pdf' arrow>
                                    <Button type="secondary"onClick={downloadPDFFile} style={{backgroundColor:'white'}}>
                                        <div style={{fontSize: '25px'}}><FilePdfOutlined /></div>
                                    </Button>
                                </Tooltip>
                                <Tooltip title='导出为pdf' arrow>
                                    <Button type="secondary"onClick={downloadPDFFile} style={{backgroundColor:'white'}}>
                                        <div style={{fontSize: '25px'}}><FileWordOutlined /></div>
                                    </Button>
                                </Tooltip>
                            </Card>
                        </Draggable>
                        </div>
                        
                   
                    {/* 上传/点击图片区域 */}
                    
                    <div
                        style={{
                            borderRadius: '10px',
                            border: '1px solid var(--semi-color-border)',
                            height: '18%',
                            padding: '2px 15px',
                            paddingLeft: '20px', // 左边距
                            paddingRight: '20px', // 右边距
                            backgroundColor: 'white'
                        }}
                    >
                        <div
                            style={{
                                flex: '9', // 上部分占比9
                                backgroundColor: 'white', // 上部分透明
                                // display: 'flex', 
                                // alignItems: 'center',
                            }}
                        >
                            {/* 上部分内容 */}
                            <Spin tip="上传中..." spinning = {isUpload}>
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
           {/* 尾部布局 */}
            <Footer
                style={{
                    // position: 'fixed',
                    // bottom: '0',
                    width: '100%',
                    height: '35px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '20px',
                    alignItems: 'center', // 垂直居中
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
                    <span style={{ marginRight: '24px' }}>平台客服</span>
                    <span>反馈建议</span>
                </span>
            </Footer>

            {/* 问答功能的悬浮按钮 */}
            <Draggable
                defaultPosition={questionPosition}
                onDrag={handleDrag2}
                // onStop={handleQDragStop}
                // bounds={bounds}
            >
                <div style={{ 
                    cursor: 'move', 
                    // 问答功能不设置在最顶部
                    // zIndex:9999, 
                    }}>
                {/* <Tooltip title='问答服务' arrow placement='left' > */}
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
            
            {/* 修改窗口 */}
            {/* 固定高度 */}
            <SideSheet title="修改" visible={visible} onCancel={handleCancel} placement='bottom' height={600}>
                {/* 文字和公式 */}
                {visible && ocrData[highlightIndex].type != 'table'&&(
                    <div style={{ display: 'flex',  height:'85%', width:'100%'}}>
                    <div style={{display: 'flex',  height:'85%', width:'90%', alignItems: 'center', justifyContent: 'center',}}>
                         {/* 文字标题显示区域 */}
                         <div style={{ height: '100%', width: '15%', }}>
                             <div style={{height:'50%', alignItems: 'center', justifyContent: 'center',}}>
                                 <p style={{marginLeft:'20px', color: 'black', fontSize: '17px', height: '50%', padding: '10px 0 0 0', margin: '0', }}>图片内容：</p>
                             </div>
                             {currentIndex != -1 && highlightIndex != -1? (
                                     <div style={{height:'50%', alignItems: 'center', justifyContent: 'center',}}>
                                     <p style={{marginLeft:'20px',  color: 'black', fontSize: '17px', height: '50%', padding: '10px 0 0 0', margin: '0', }}>Latex渲染：</p>
                                 </div>
                                     ) :
                                     null}
                             
                             <div style={{height:'50%', alignItems: 'center', justifyContent: 'center',}}>
                                 <p style={{marginLeft:'20px',  color: 'black', fontSize: '17px', height: '50%', padding: '10px 0 0 0', margin: '0', }}>识别文本：</p>
                             </div>
                         </div>
                         {/* 图片+输入文本框 */}
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
                                 {/* 单行输入框 */}
                                 {/* <input id='modified' type="text" className="ocr-input" value={text} onChange={handleSelectionChange} style={{ width: '600px', fontSize:'16px', height:'28px', outline: 'none' }}/> */}
                                 {/* 多行输入框 */}
                                 <textarea id="modified" className="ocr-input" value={text} onChange={handleSelectionChange} style={{ width: '90%', fontSize:'16px', outline: 'none' }} rows={4} />
                             </div>
                         </div>
                     </div>
                     {/* 按键区 */}
                     <div style={{ display: 'flex', bottom: '0', width: '10%', flexDirection: 'column',}}>
                         <div style={{height: '82%',}}></div>
                         <div style={{ height: '18%',}}>
                             <Button
                                 onClick={() => handleDec()}
                                 style={{
                                     margin: '10px 40px',
                                     fontSize: '20px', // 增大文本大小
                                     padding: '15px 15px', // 调整按钮尺寸
                                     color: '#fff',
                                     borderColor: '#2e6ff6',
                                     background: '#2e6ff6',
                                     textShadow: '0 -1px 0 rgba(0,0,0,.12)',
                                     boxShadow: '0 2px rgba(0,0,0,.043)',
                                     alignSelf: 'flex-end', // 将按钮对齐到右侧
                                 }}>删除</Button>
 
                             <Button
                                 onClick={() => handleOk()}
                                 style={{
                                     margin: '10px 40px',
                                     fontSize: '20px', // 增大文本大小
                                     padding: '15px 15px', // 调整按钮尺寸
                                     color: '#fff',
                                     borderColor: '#2e6ff6',
                                     background: '#2e6ff6',
                                     textShadow: '0 -1px 0 rgba(0,0,0,.12)',
                                     boxShadow: '0 2px rgba(0,0,0,.043)',
                                     alignSelf: 'flex-end', // 将按钮对齐到右侧
                                 }}>修改</Button>
                         </div>
                     </div>               
                 </div>
                )}
                {/* 表格 */}
                {visible && ocrData[highlightIndex].type === 'table'&&(
                    // 总的区域
                    <div style={{display: 'flex', height: '95%', width:'100%'}}>
                        {/* 左侧显示原图片 */}
                        <div style={{height: '100%', width:'45%'}}>
                            <p style={{marginLeft:'20px', color: 'black', fontSize: '17px', height:'10%', padding: '10px 0 0 0', margin: '0', }}>图片内容：</p>
                            <div style={{height:'90%', alignItems: 'center', justifyContent: 'center',}}>
                                <div
                                    id="show-part-picture" 
                                    style={{ padding: '10px' }}
                                >
                                </div>          
                            </div>
                        </div>
                        {/* 右侧显示渲染表格 */}
                        <div style={{height: '100%', width:'45%'}}>
                            <p style={{marginLeft:'20px', color: 'black', fontSize: '17px', height:'10%', padding: '10px 0 0 0', margin: '0', }}>表格渲染：</p>
                            <div style={{height:'90%', alignItems: 'center', justifyContent: 'center',}}>
                                 <div
                                    ref={tableEditableRef}
                                    contentEditable={true}
                                    onBlur={handleBlur_table}
                                    dangerouslySetInnerHTML={{ __html: htmlContent_table }}
                                ></div>
                            </div>
                        </div>
                        {/* 最右侧显示按钮 */}
                        <div style={{height: '100%', width:'10%'}}>
                            <div style={{height: '60%',}}></div>
                            <div style={{height: '40%'}}>
                                {/* 这里添加你要的增加行，列，删除行、列的按钮 */}
                                <Button
                                    onClick={()=>{setHtmlContent_table(addRow(htmlContent_table))}}
                                    style={{
                                        margin: '10px 40px',
                                        fontSize: '20px', // 增大文本大小
                                        padding: '15px 15px', // 调整按钮尺寸
                                        color: '#fff',
                                        borderColor: '#2e6ff6',
                                        background: '#2e6ff6',
                                        textShadow: '0 -1px 0 rgba(0,0,0,.12)',
                                        boxShadow: '0 2px rgba(0,0,0,.043)',
                                        alignSelf: 'flex-end', // 将按钮对齐到右侧
                                    }}>加行</Button>
                                <Button
                                    onClick={()=>{setHtmlContent_table(addColumn(htmlContent_table))}}
                                    style={{
                                        margin: '10px 40px',
                                        fontSize: '20px', // 增大文本大小
                                        padding: '15px 15px', // 调整按钮尺寸
                                        color: '#fff',
                                        borderColor: '#2e6ff6',
                                        background: '#2e6ff6',
                                        textShadow: '0 -1px 0 rgba(0,0,0,.12)',
                                        boxShadow: '0 2px rgba(0,0,0,.043)',
                                        alignSelf: 'flex-end', // 将按钮对齐到右侧
                                    }}>加列</Button>
                                <Button
                                    onClick={() => handleDec()}
                                    style={{
                                        margin: '10px 40px',
                                        fontSize: '20px', // 增大文本大小
                                        padding: '15px 15px', // 调整按钮尺寸
                                        color: '#fff',
                                        borderColor: '#2e6ff6',
                                        background: '#2e6ff6',
                                        textShadow: '0 -1px 0 rgba(0,0,0,.12)',
                                        boxShadow: '0 2px rgba(0,0,0,.043)',
                                        alignSelf: 'flex-end', // 将按钮对齐到右侧
                                    }}>删除</Button>

                                <Button
                                    onClick={() => handleOk()}
                                    style={{
                                        margin: '10px 40px',
                                        fontSize: '20px', // 增大文本大小
                                        padding: '15px 15px', // 调整按钮尺寸
                                        color: '#fff',
                                        borderColor: '#2e6ff6',
                                        background: '#2e6ff6',
                                        textShadow: '0 -1px 0 rgba(0,0,0,.12)',
                                        boxShadow: '0 2px rgba(0,0,0,.043)',
                                        alignSelf: 'flex-end', // 将按钮对齐到右侧
                                    }}>修改</Button>
                            </div>
                        </div>
                    </div>
                )}

            </SideSheet>
           {/* 公式符号输入提示的悬浮按钮----可拖动 */}
           {visible &&ocrData[highlightIndex].type != 'table'&& (
                <Draggable defaultPosition={formulaPosition} onDrag={handleDrag1}>
                    <div style={{ cursor: 'move', zIndex: 9999 }}>
                    <Formula handleSymbolClick={handleSymbolClick} />
                    </div>
                </Draggable>
            )}
            {/* 问答功能窗口 */}
            <SideSheet title="问答功能" visible={chatVisible} onCancel={change} style={{width:'30%', height:'100%'}}>
                <ChatBox messages={messages} setMessages={setMessages} data={dataList} />
            </SideSheet>
            {/* 添加文本窗口 */}
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
