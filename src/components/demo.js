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
import {
    IconSemiLogo,
    IconBell,
    IconHelpCircle,
    IconBytedanceLogo,
    IconHome,
    IconHistogram,
    IconLive,
    IconSetting,
    IconDelete
} from '@douyinfe/semi-icons';
import DraggableDivider from  './components/DraggableDivider'
import { SideSheet, Upload, Spin } from '@douyinfe/semi-ui';
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
import ChatBox from './components/ChatBox';
import './App.css'; 
const App = () => {

    const exportToWord = () => {
        const htt = '<p>This is some HTML content.</p>';
        const exportOptions = {
          fileName:'my_document.docx',
          pageOrientation: 'portrait', // 页面方向，可选项
          pageSize: 'A4', // 页面尺寸，可选项
        };
    
        exportWord(htt,exportOptions);
      };

    //当前识别的图片编号
    const [currentIndex, setCurrentIndex] = useState(-1);
    //图片数目
    const [imageNum, setImageNum] = useState(0);
    const [rectangleList, setRectangleList] = useState([]) //矩形信息
    //识别中判断
    const [isUpload,setIsUpload] = useState(false);
    // 图片列表
    const [file, setFile] = useState([]); 
    const [dataList, setDataList] = useState([])    //记录所有识别数据
    const [ocrData, setOcrData] = useState(null);   //目前版本还原的文本数据
    //-------------交互实现------------------

    //置信度
    const [confidenceThres, setconfidenceThres] = useState(1) //置信度阈值


     //-----------------添加功能实现-------------------
    const [showImageAnnotator, setShowImageAnnotator] = useState(false); //图片标注界面


    const convertToPDF = () => {
        var element = document.getElementById("demo");    // 这个dom元素是要导出pdf的div容器
        var w = element.offsetWidth;    // 获得该容器的宽
        var h = element.offsetHeight;    // 获得该容器的高
        var offsetTop = element.offsetTop;    // 获得该容器到文档顶部的距离
        var offsetLeft = element.offsetLeft;    // 获得该容器到文档最左的距离
        var canvas = document.createElement("canvas");
        var abs = 0;
        var win_i =  document.body.clientWidth;    // 获得当前可视窗口的宽度（不包含滚动条）
        var win_o = window.innerWidth;    // 获得当前窗口的宽度（包含滚动条）
        if (win_o > win_i) {
            abs = (win_o - win_i) / 2;    // 获得滚动条长度的一半
        }
        canvas.width = w * 2;    // 将画布宽&&高放大两倍
        canvas.height = h * 2;
        var context = canvas.getContext("2d");
        context.scale(2, 2);
        context.translate(-offsetLeft - abs, -offsetTop);
        // 这里默认横向没有滚动条的情况，因为offset.left(),有无滚动条的时候存在差值，因此
        // translate的时候，要把这个差值去掉
        html2canvas(element,{
            allowTaint: true,
            scale: 2 // 提升画面质量，但是会增加文件大小
        }).then(function (canvas) {
            var contentWidth = canvas.width;
            var contentHeight = canvas.height;
            //一页pdf显示html页面生成的canvas高度;
            var pageHeight = contentWidth / 592.28 * 841.89;
            //未生成pdf的html页面高度
            var leftHeight = contentHeight;
            //页面偏移
            var position = 0;
            //a4纸的尺寸[595.28,841.89]，html页面生成的canvas在pdf中图片的宽高
            var imgWidth = 595.28;
            var imgHeight = 592.28 / contentWidth * contentHeight;

            var pageData = canvas.toDataURL('image/jpeg', 1.0);

            var pdf = new jsPDF('', 'pt', 'a4');

            //有两个高度需要区分，一个是html页面的实际高度，和生成pdf的页面高度(841.89)
            //当内容未超过pdf一页显示的范围，无需分页
            if (leftHeight < pageHeight) {
                pdf.addImage(pageData, 'JPEG', 0, 0, imgWidth, imgHeight);
            } else {    // 分页
                while (leftHeight > 0) {
                    pdf.addImage(pageData, 'JPEG', 0, position, imgWidth, imgHeight)
                    leftHeight -= pageHeight;
                    position -= 841.89;
                    //避免添加空白页
                    if (leftHeight > 0) {
                        pdf.addPage();
                    }
                }
            }
            pdf.save('test.pdf');
        });
    }
    //处理添加按钮点击事件
    const handleAdd = () => {
        
        if(file!=null) {
            setShowImageAnnotator(true);
        } else {
            console.log("此时未上传图片！")
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
            const html = ocrData.map(item => {
                const { position, text, type } = item;
                const style = `position: absolute; top: ${position[0][1] * 100}%; left: ${position[0][0] * 100}%;`;
                const renderedText = type === 'formula' ? renderLaTeX(text) : text;
                return `<div style="${style}" data-type="${type}">${renderedText}</div>`;
            }).join('');
            console.log(html);
            setHtmlContent(html);
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
    // useEffect(() => {
    //     if(dataList[currentIndex]){
    //         drawImageAndRectangle(File, dataList[currentIndex].data,model1,model2);
    //     }
        
    //     // 在这里可以执行与htmlContent有关的其他逻辑
    // }, [confidenceThres]);

    //文本标记方式按键参数
    const [model1,setModel1]= useState(false)
    const [model2,setModel2]= useState(false)
    const [highlightIndex,setHighlightIndex] = useState(-1)
    const resetMode1=() => {
        let t = !model1;
        setModel1(t);
        console.log(t);
        drawImageAndRectangle(file[currentIndex],dataList[currentIndex].data,t,model2)
    };
    
    const resetMode2= () => {
        let t = !model2;
        setModel2(t);
        console.log(t);
        drawImageAndRectangle(file[currentIndex],dataList[currentIndex].data,model1,t)
    };
    const canvasRef = useRef(null);
    //高亮点击事件
    const highLight = (event) => {
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
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')
            const newCanvas = document.createElement('canvas');
            const newCtx = newCanvas.getContext('2d');
            const tempPartImage = ctx.getImageData(rectangleList[index].x, rectangleList[index].y,rectangleList[index].width, rectangleList[index].height);
            newCanvas.width = rectangleList[index].width;
            newCanvas.height =rectangleList[index].height;
            // 将矩形位置的像素数据绘制
            newCtx.putImageData(tempPartImage, 0, 0);
            drawImageAndRectangle(file[currentIndex],dataList[currentIndex].data,model1,model2,index)
            if (highlightIndex == index){
                showDialog(index,function() {
                    // 延迟执行回调函数
                    setTimeout(function() {
                        // 获取弹窗容器元素
                        const dialogElement = document.getElementById('show-part-picture');
                        // 将新的Canvas元素添加为弹窗容器元素的子节点
                        if (ocrData[index].type == "formula"){
                            setHtmlContent_formula(renderLaTeX(ocrData[index].text))
                        }else{
                            dialogElement.appendChild(newCanvas);
                        }
                    }, 0);
                });
            }else{
                setHighlightIndex(index);
            }
        }
        
    }
    function drawImageAndRectangle (file,data,flag1 = 0,flag2 = 0,flag3 = -1){
        const blobUrl = URL.createObjectURL(file.fileInstance)
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const image = new Image()
        image.src = blobUrl;
        let rectangles = [];
        image.onload = () => {
            //获取图片的实际宽度和高度
            const imageWidth = image.width;
            const imageHeight = image.height;
            //计算缩放比例，以确保图片按照固定比例进行显示
            //这里初始以容器的宽和高来设置
            const ratio = Math.min(1000/ imageWidth, 600 / imageHeight);
            const displayWidth = imageWidth * ratio;
            const displayHeight = imageHeight * ratio;
        
            // 修改图片对象的宽度和高度属性
            image.width = displayWidth;
            image.height = displayHeight;
        
            // 设置 canvas 的宽度和高度与图片的显示宽度和高度一致
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            // 绘制图片到 canvas
            ctx.drawImage(image, 0, 0, displayWidth, displayHeight);
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
                    const rItem = { x, y, width, height, index }
                    rectangles.push(rItem)
                    // 画矩形
                    if(flag2){
                        ctx.fillStyle ='rgb(0, 128, 128,0.5)';
                        ctx.fillRect(x, y, width, height);
                        ctx.font = '14px Arial';  // 设置字体大小和字体样式
                        ctx.fillStyle = 'rgb(176, 190, 197)';
                        ctx.fillText(`${index}`, x, y);  // 在位置(x,y)绘制文本数字1
                    }
                    if(index == flag3){
                        ctx.fillStyle ='rgb(0, 255, 0,0.5)';
                        ctx.fillRect(x, y, width, height);
                        ctx.font = '14px Arial';  // 设置字体大小和字体样式
                        ctx.fillStyle = 'rgb(246, 195, 69)';
                        ctx.fillText(`${index}`, x, y);  // 在位置(x,y)绘制文本数字1
                        const html = ocrData.map((item,index) => {
                            const { position, text, type } = item;
                            const style = `  position: absolute; top: ${position[0][1] * 100}%; left: ${position[0][0] * 100}%; `;
                            const renderedText = type === 'formula' ? renderLaTeX(text) : text;
                            // return `<div style="${style}" data-type="${type}">${renderedText}</div>`;
                            if (index ==    flag3 ){
                                return `<div style="color: red; ${style}" data-type="${type}">
                                            ${renderedText}
                                        </div>`
                            }else{
                                return `<div style="${style}" data-type="${type}">${renderedText}</div>`;
                            }
                        }).join('');
                        setHtmlContent(html);
                    }
                    if (flag1){
                        if(score <= confidenceThres){
                            ctx.strokeStyle ='rgb(255, 0, 0)';
                        }else{
                            ctx.strokeStyle ='rgb(246, 195, 69)';
                        }
                        
                        ctx.lineWidth = 1.5 ;
                        ctx.strokeRect(x, y, width, height);
                        ctx.font = '14px Arial';  // 设置字体大小和字体样式
                        ctx.fillStyle = 'rgb(246, 195, 69)';
                        ctx.fillText(`${index}`, x, y);  // 在位置(x,y)绘制文本数字1
                    }
                });
            setRectangleList([...rectangles])
          URL.revokeObjectURL(blobUrl)
        }
    }


   //---------------版面还原-----------------
    
    const [htmlContent, setHtmlContent] = useState(`
    <div style="color: gray; display: flex; justify-content: center; align-items: center; flex-direction: column; margin-top: 200px;">
        <p style="font-size: 32px;">版面还原区域</p>
        <p style="font-size: 32px;">针对识别结果准确还原</p>
    </div>    
    `);
    const [htmlContent_demo, setHtmlContent_demo] = useState(`
    <div style="color: gray; display: flex; justify-content: center; align-items: center; flex-direction: column; margin-top: 200px;">
        <p style="font-size: 32px;">图片显示区域</p>
        <p style="font-size: 32px;">点击下方添加按键添加图片</p>
    </div>    
    `);
    const [htmlContent_formula, setHtmlContent_formula] = useState(``);
    const editableRef = useRef(null);

    //latex转公式
    const renderLaTeX = (latex) => {
        return ReactDOMServer.renderToString(<InlineMath math={latex} errorColor={'#cc0000'} />);
    };
    
    // 将 OCR 数据转换为 HTML 内容  
    useEffect(() => {
        console.log(ocrData);
        if (ocrData) {
        const html = ocrData.map((item,index) => {
            const { position, text, type } = item;
            const style = `  position: absolute; top: ${position[0][1] * 100}%; left: ${position[0][0] * 100}%; `;
            const renderedText = type === 'formula' ? renderLaTeX(text) : text;
            // return `<div style="${style}" data-type="${type}">${renderedText}</div>`;
            if (index ==    highlightIndex ){
                return `<div style="color: red; ${style}" data-type="${type}">
                            ${renderedText}
                        </div>`
            }else{
                return `<div style="${style}" data-type="${type}">${renderedText}</div>`;
            }
        }).join('');
        setHtmlContent(html);
        }
    }, [ocrData]);

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
            const text = type === "formula"? ocrData[index].text:element.innerHTML;
            const score = ocrData[index].score;
            return { position, text, type,score };
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
        console.log(updatedOcrData);
        setOcrData(updatedOcrData);
    };


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
        file.forEach((item, index)=>{
            if(item.url == File.url){
                drawImageAndRectangle(File,dataList[index].data);
                setCurrentIndex(index);
                console.log(index);
                setOcrData(dataList[index].data);
            }
        })
    }
    
    //图片上传保存
    const imageUpload = ({ fileList, currentFile, event }) => {
        setFile(fileList);
    };

    async function imageOCR (){
        setIsUpload(true);
        const url = file[imageNum].url
        console.log(url);
        setImageNum(imageNum+1);
        const formData = new FormData();
        const blob = await urlToBlob(url);
        formData.append('image', blob);
        try {
            fetch('http://127.0.0.1:5000/ceshi', {
                method: 'POST',
                body: formData
            })
            //解析后端返回数据
            .then(response => response.json())
            .then(Data => {
                console.log(Data);
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
                  console.log(data);
                  const dataObj = { url, data };
                  dataList.push(dataObj);
                setIsUpload(false);
            })
        } catch (error) {
            console.error('发生错误：', error);
        }
    }

      //功能实现————弹窗实现
    const [visible, setVisible] = useState(false);
    const [text, setText] = useState('');
    function showDialog(index,callback) {
        if(index != -1){
            setVisible(true);
            setText(ocrData[index].text);
            if(typeof callback === 'function'){
                callback();
            }
        }
    }
    
    const handleOk = () => {
        setVisible(false);
        let text0 = ocrData;
        text0[highlightIndex].text = text;
        dataList[currentIndex].data = text0;
        setDataList(dataList);
        setOcrData(text0);
        if (text0) {
            const html = ocrData.map(item => {
                const { position, text, type } = item;
                const style = `position: absolute; top: ${position[0][1] * 100}%; left: ${position[0][0] * 100}%;`;
                const renderedText = type === 'formula' ? renderLaTeX(text) : text;
                return `<div style="${style}" data-type="${type}">${renderedText}</div>`;
            }).join('');
            console.log(html);
            setHtmlContent(html);
        }
        drawImageAndRectangle(file[currentIndex],dataList[currentIndex].data,model1,model2)
        setHtmlContent_formula(renderLaTeX(""))
    };
    const handleCancel = () => {
        setVisible(false);
        drawImageAndRectangle(file[currentIndex],dataList[currentIndex].data,model1,model2)
        const html = ocrData.map((item,index) => {
            const { position, text, type } = item;
            const style = `  position: absolute; top: ${position[0][1] * 100}%; left: ${position[0][0] * 100}%; `;
            const renderedText = type === 'formula' ? renderLaTeX(text) : text;
            console.log(highlightIndex);
            return `<div style="${style}" data-type="${type}">${renderedText}</div>`;
        }).join('');
        setHtmlContent(html);
        setHighlightIndex(-1)
        setHtmlContent_formula(renderLaTeX(""))
    };

    const handleSelectionChange = (event) =>{
        setText(event.target.value);
    }

    const handleDec = () => {
        console.log("删除");
        // 若没有高亮，则index此时为-1
        if (highlightIndex != -1) {
          //更新currentTextList
          ocrData.splice(highlightIndex, 1);
          const html = ocrData.map(item => {
            const { position, text, type } = item;
            const style = `position: absolute; top: ${position[0][1] * 100}%; left: ${position[0][0] * 100}%;`;
            const renderedText = type === 'formula' ? renderLaTeX(text) : text;
            return `<div style="${style}" data-type="${type}">${renderedText}</div>`;
        }).join('');
        console.log(html);
        setHtmlContent(html);
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
        },
      ]);
    const [chatVisible, setChatVisible] = useState(false);
    const change = () => {
        setChatVisible(!chatVisible);
    };

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
            <Header style={{ backgroundColor: 'var(--semi-color-bg-1)' }}>
                <div>
                    <Nav mode="horizontal" defaultSelectedKeys={['Home']}>
                        {/* 图标 */}
                        <Nav.Header>
                            <IconSemiLogo style={{ height: '36px', fontSize: 36 }} />
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
                                    color: 'var(--semi-color-text-0)',
                                    fontWeight: '600',
                                }}
                            >
                               OCR交互平台
                            </span>
                        </span>
                        {/* 后部功能键 */}
                        <Nav.Footer>
                            <Button
                                theme="borderless"
                                icon={<IconBell size="large" />}
                                style={{
                                    color: 'var(--semi-color-text-2)',
                                    marginRight: '12px',
                                }}
                            />
                            <Button
                                theme="borderless"
                                icon={<IconHelpCircle size="large" />}
                                style={{
                                    color: 'var(--semi-color-text-2)',
                                    marginRight: '12px',
                                }}
                            />
                            <Avatar color="orange" size="small">
                                YZ
                            </Avatar>
                        </Nav.Footer>
                    </Nav>
                </div>
            </Header>
            <Content
                    style={{
                        padding: '10px',
                        height: '80vh', 
                        backgroundColor: '#f0f0f0',
                        
                    }}
                >
                    {/* 图片展示区域 */}
                    <div
                        style={{
                            borderRadius: '10px',
                            border: '1px solid var(--semi-color-border)',
                            height: '70%',
                            padding: '10px',
                            backgroundColor: 'white',
                            marginBottom: '10px',
                            position: 'relative', // 相对定位

                        }}
                    >
                        {/* 分界线 */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '0',
                                left: '50%', // 在左右对半分
                                height: '100%',
                                width: '6px', // 分界线宽度
                                backgroundColor: 'grey', // 分界线颜色 
                            }}
                        />
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
                                    height: '90%', // 上部分占比9
                                    backgroundColor: 'white', // 添加分界线
                                    overflow: 'auto', // 添加滚动条
                                }}
                            >
                                {currentIndex === -1 ? (
                                    <div
                                        dangerouslySetInnerHTML={{ __html:htmlContent_demo }}
                                    >
                                    </div>
                                    ) : null}
                                <canvas ref={canvasRef} className='image'  onClick={(e) => highLight(e)} />
                            </div>
                            {/* 按键区 */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    left: '0',
                                    width: '50%',
                                    height: '5%', // 下部分占比1
                                    borderTop: '1px solid grey',
                                    backgroundColor: 'white', // 下部分为灰色
                                   
                                }}
                            >
                                <Button type="secondary"onClick={resetMode1} ><IconFontColor /></Button>
                                <Button type="secondary"onClick={resetMode2}><IconMark /></Button>
                                <Button type="secondary"onClick={handleAdd}><IconPlus /></Button>
                                <input
                                    id="inputValue"
                                    defaultValue=""
                                    placeholder="0-1之间,默认为1"
                                    title='0-1之间,默认为1'
                                    type="text"
                                    className="placeholder-style"
                                    onChange={saveInputValue}
                                    value={confidenceThres}
                                />
                            </div>
                        </div>
                        <div
                            style={{
                                width: '50%', // 左右对半
                                height: '100%', // 完全填充父容器
                                display: 'inline-block', // 行内块级元素
                                verticalAlign: 'top', // 顶部对齐
                            }}
                        >
                            {/* 版面还原区 */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '0',
                                    bottom:'0',
                                    right: '-5px',
                                    width: '50%',
                                    height: '90%', // 上部分占比9
                                    overflow: 'auto', // 添加滚动条
                                    backgroundColor: 'white', // 添加分界线
                                }}
                                id = "demo"
                                ref={editableRef}
                                contentEditable={true}
                                onBlur={handleBlur}
                                dangerouslySetInnerHTML={{ __html: htmlContent }}
                             >
                              
                            </div>
                            {/* 按键区 */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    right: '0',
                                    width: '50%',
                                    height: '5%', // 下部分占比1
                                    borderTop: '1px solid grey',
                                    backgroundColor: 'white', // 下部分为灰色
                                    
                                }}
                            >
                                <div style={{ textAlign: 'right' }}>
                                    <Button type="secondary" onClick={change}>
                                        切换至问答功能  
                                    </Button>
                                </div>
                            </div>
                            {/* 右侧内容 */}
                        </div>
                    </div>
                    {/* 上传图片区域 */}
                    <div
                        style={{
                            borderRadius: '10px',
                            border: '1px solid var(--semi-color-border)',
                            height: '20%',
                            padding: '7px 20px',
                            paddingLeft: '40px', // 左边距
                            paddingRight: '40px', // 右边距
                            backgroundColor: 'white'
                        }}
                    >
                        <div
                            style={{
                                flex: '10', // 上部分占比9
                                backgroundColor: 'white', // 上部分透明
                                paddingBottom: '15px',
                            }}
                        >
                            {/* 上部分内容 */}
                                <Upload 
                                    action='https://api.semi.design/upload'
                                    listType="picture" 
                                    showPicInfo
                                    multiple 
                                    style={{ marginTop: 10 }}
                                    file={file}
                                    onChange={imageUpload}
                                    onPreviewClick={imageSelect}
                                    onSuccess={imageOCR}
                                    className={{ marginTop: 10, height: '100%', flex: 1 }}
                                >
                                    <IconPlus size="extra-large" />
                                </Upload>
                        </div>
                            
                        <div
                            style={{
                                flex: '1', // 下部分占比1
                                backgroundColor: 'white', // 下部分为黑色
                                padding: '10px 0',
                                display: 'flex',
                                justifyContent: 'flex-end', // 内容靠右
                                borderTop: '1px solid grey',
                            }}
                        >
                            <Button type="secondary"onClick={exportToWord}>导出为png/jpg</Button>
                            <Button type="secondary"onClick={convertToPDF}>导出为PDF</Button>
                            <Button type="secondary"onClick={exportToWord}>导出为docx/txt</Button>
                        </div>
                    </div>
            </Content>
            {/* 尾部布局 */}
            <Footer
                style={{
                    position: 'fixed',
                    bottom: '0',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '20px',
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
                    <span> created by ZhouYang </span>
                </span>
                <span>
                    <span style={{ marginRight: '24px' }}>平台客服</span>
                    <span>反馈建议</span>
                </span>
            </Footer>
            <SideSheet title="修改" visible={visible} onCancel={handleCancel} placement='bottom' height={300}>
                <div className='modify-place' style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }} >
                    {/* 修改弹窗内容部分 */}
                    <p style={{ marginLeft: '200px', color: 'bslack', fontSize: '16px' }}>图片内容：</p>
                    {currentIndex != -1 && ocrData[currentIndex].type === "formula" ? (
                        <div
                            id="show-part-picture" 
                            dangerouslySetInnerHTML={{ __html:htmlContent_formula }}
                        >
                        </div>) : 
                        <div id="show-part-picture" style={{ marginLeft: '20px' }}></div>}
                    {/* <div id="show-part-picture" style={{ marginLeft: '20px' }}></div> */}
                    <p style={{ marginLeft: '100px', color: 'black', fontSize: '16px' }}>识别文本：</p>
                    <input type="text" className="ocr-input" value={text} onChange={handleSelectionChange} style={{ marginLeft: '20px', width: '200px' }}/>
                    <Button type="primary" size='middle' className="custom-button" onClick={() => handleOk()} style={{ marginLeft: '20px' }}><IconEdit /></Button>
                    <Button type="primary" size='middle' className="custom-button" onClick={() => handleDec()} style={{ marginLeft: '20px' }}>删除</Button>
                </div>
            </SideSheet>
            <SideSheet title="问答功能" visible={chatVisible} onCancel={change}>
                <ChatBox messages={messages} setMessages={setMessages} data={dataList} />
            </SideSheet>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                {showImageAnnotator && (
                    <ImageAnnotator image={file[currentIndex].url} onClose={handleImageAnnotatorClose} />
                )}
            </div>
        </Layout>
    );
};

const windowContainerStyle = {
    flex: 1,
    padding: '100px !important', /* 上下左右的间距 */
    border: '1px solid #888', /* 灰色边框 */
    borderRadius: '10px', /* 圆角 */
  };
export default App;
