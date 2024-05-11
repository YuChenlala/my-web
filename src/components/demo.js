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
          pageOrientation: 'portrait', // ҳ�淽�򣬿�ѡ��
          pageSize: 'A4', // ҳ��ߴ磬��ѡ��
        };
    
        exportWord(htt,exportOptions);
      };

    //��ǰʶ���ͼƬ���
    const [currentIndex, setCurrentIndex] = useState(-1);
    //ͼƬ��Ŀ
    const [imageNum, setImageNum] = useState(0);
    const [rectangleList, setRectangleList] = useState([]) //������Ϣ
    //ʶ�����ж�
    const [isUpload,setIsUpload] = useState(false);
    // ͼƬ�б�
    const [file, setFile] = useState([]); 
    const [dataList, setDataList] = useState([])    //��¼����ʶ������
    const [ocrData, setOcrData] = useState(null);   //Ŀǰ�汾��ԭ���ı�����
    //-------------����ʵ��------------------

    //���Ŷ�
    const [confidenceThres, setconfidenceThres] = useState(1) //���Ŷ���ֵ


     //-----------------��ӹ���ʵ��-------------------
    const [showImageAnnotator, setShowImageAnnotator] = useState(false); //ͼƬ��ע����


    const convertToPDF = () => {
        var element = document.getElementById("demo");    // ���domԪ����Ҫ����pdf��div����
        var w = element.offsetWidth;    // ��ø������Ŀ�
        var h = element.offsetHeight;    // ��ø������ĸ�
        var offsetTop = element.offsetTop;    // ��ø��������ĵ������ľ���
        var offsetLeft = element.offsetLeft;    // ��ø��������ĵ�����ľ���
        var canvas = document.createElement("canvas");
        var abs = 0;
        var win_i =  document.body.clientWidth;    // ��õ�ǰ���Ӵ��ڵĿ�ȣ���������������
        var win_o = window.innerWidth;    // ��õ�ǰ���ڵĿ�ȣ�������������
        if (win_o > win_i) {
            abs = (win_o - win_i) / 2;    // ��ù��������ȵ�һ��
        }
        canvas.width = w * 2;    // ��������&&�߷Ŵ�����
        canvas.height = h * 2;
        var context = canvas.getContext("2d");
        context.scale(2, 2);
        context.translate(-offsetLeft - abs, -offsetTop);
        // ����Ĭ�Ϻ���û�й��������������Ϊoffset.left(),���޹�������ʱ����ڲ�ֵ�����
        // translate��ʱ��Ҫ�������ֵȥ��
        html2canvas(element,{
            allowTaint: true,
            scale: 2 // �����������������ǻ������ļ���С
        }).then(function (canvas) {
            var contentWidth = canvas.width;
            var contentHeight = canvas.height;
            //һҳpdf��ʾhtmlҳ�����ɵ�canvas�߶�;
            var pageHeight = contentWidth / 592.28 * 841.89;
            //δ����pdf��htmlҳ��߶�
            var leftHeight = contentHeight;
            //ҳ��ƫ��
            var position = 0;
            //a4ֽ�ĳߴ�[595.28,841.89]��htmlҳ�����ɵ�canvas��pdf��ͼƬ�Ŀ��
            var imgWidth = 595.28;
            var imgHeight = 592.28 / contentWidth * contentHeight;

            var pageData = canvas.toDataURL('image/jpeg', 1.0);

            var pdf = new jsPDF('', 'pt', 'a4');

            //�������߶���Ҫ���֣�һ����htmlҳ���ʵ�ʸ߶ȣ�������pdf��ҳ��߶�(841.89)
            //������δ����pdfһҳ��ʾ�ķ�Χ�������ҳ
            if (leftHeight < pageHeight) {
                pdf.addImage(pageData, 'JPEG', 0, 0, imgWidth, imgHeight);
            } else {    // ��ҳ
                while (leftHeight > 0) {
                    pdf.addImage(pageData, 'JPEG', 0, position, imgWidth, imgHeight)
                    leftHeight -= pageHeight;
                    position -= 841.89;
                    //������ӿհ�ҳ
                    if (leftHeight > 0) {
                        pdf.addPage();
                    }
                }
            }
            pdf.save('test.pdf');
        });
    }
    //������Ӱ�ť����¼�
    const handleAdd = () => {
        
        if(file!=null) {
            setShowImageAnnotator(true);
        } else {
            console.log("��ʱδ�ϴ�ͼƬ��")
        }
        
    }
    //������ӱ�ע�ص�����
    const handleImageAnnotatorClose = (annotatedData) => {
        console.log("��ӻص�");
        console.log(annotatedData);
        if (annotatedData.text!=[] && annotatedData.rectangles!=[]) {
        //��Ӿ��崦���ע���ݲ���
        //�������ľ���������ı����ݼ���
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
        //�رս���
        setShowImageAnnotator(false);
    }


    //----------------�������Ŷ���ֵ����-------------------
    const saveInputValue = () => {
        let inputValue = document.getElementById("inputValue").value;
        setconfidenceThres(inputValue);
        console.log("��ʾ���õ���ֵ��", inputValue);
    }
    // useEffect(() => {
    //     if(dataList[currentIndex]){
    //         drawImageAndRectangle(File, dataList[currentIndex].data,model1,model2);
    //     }
        
    //     // ���������ִ����htmlContent�йص������߼�
    // }, [confidenceThres]);

    //�ı���Ƿ�ʽ��������
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
    //��������¼�
    const highLight = (event) => {
        let rect = canvasRef.current.getBoundingClientRect();
        // ��ȡ�������λ����Ϣ
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
            // ������λ�õ��������ݻ���
            newCtx.putImageData(tempPartImage, 0, 0);
            drawImageAndRectangle(file[currentIndex],dataList[currentIndex].data,model1,model2,index)
            if (highlightIndex == index){
                showDialog(index,function() {
                    // �ӳ�ִ�лص�����
                    setTimeout(function() {
                        // ��ȡ��������Ԫ��
                        const dialogElement = document.getElementById('show-part-picture');
                        // ���µ�CanvasԪ�����Ϊ��������Ԫ�ص��ӽڵ�
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
            //��ȡͼƬ��ʵ�ʿ�Ⱥ͸߶�
            const imageWidth = image.width;
            const imageHeight = image.height;
            //�������ű�������ȷ��ͼƬ���չ̶�����������ʾ
            //�����ʼ�������Ŀ�͸�������
            const ratio = Math.min(1000/ imageWidth, 600 / imageHeight);
            const displayWidth = imageWidth * ratio;
            const displayHeight = imageHeight * ratio;
        
            // �޸�ͼƬ����Ŀ�Ⱥ͸߶�����
            image.width = displayWidth;
            image.height = displayHeight;
        
            // ���� canvas �Ŀ�Ⱥ͸߶���ͼƬ����ʾ��Ⱥ͸߶�һ��
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            // ����ͼƬ�� canvas
            ctx.drawImage(image, 0, 0, displayWidth, displayHeight);
                //��ȡ����;�ȷ����Ⱦ
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
                    //�� = ����x - ����x
                    const width = (x2 - x1) * image.width
                    //�� = ����y - ����x
                    const height = (y4 - y1) * image.height
                    //x
                    const x = x1 * image.width
                    //y
                    const y = y1 * image.height  
                    const rItem = { x, y, width, height, index }
                    rectangles.push(rItem)
                    // ������
                    if(flag2){
                        ctx.fillStyle ='rgb(0, 128, 128,0.5)';
                        ctx.fillRect(x, y, width, height);
                        ctx.font = '14px Arial';  // ���������С��������ʽ
                        ctx.fillStyle = 'rgb(176, 190, 197)';
                        ctx.fillText(`${index}`, x, y);  // ��λ��(x,y)�����ı�����1
                    }
                    if(index == flag3){
                        ctx.fillStyle ='rgb(0, 255, 0,0.5)';
                        ctx.fillRect(x, y, width, height);
                        ctx.font = '14px Arial';  // ���������С��������ʽ
                        ctx.fillStyle = 'rgb(246, 195, 69)';
                        ctx.fillText(`${index}`, x, y);  // ��λ��(x,y)�����ı�����1
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
                        ctx.font = '14px Arial';  // ���������С��������ʽ
                        ctx.fillStyle = 'rgb(246, 195, 69)';
                        ctx.fillText(`${index}`, x, y);  // ��λ��(x,y)�����ı�����1
                    }
                });
            setRectangleList([...rectangles])
          URL.revokeObjectURL(blobUrl)
        }
    }


   //---------------���滹ԭ-----------------
    
    const [htmlContent, setHtmlContent] = useState(`
    <div style="color: gray; display: flex; justify-content: center; align-items: center; flex-direction: column; margin-top: 200px;">
        <p style="font-size: 32px;">���滹ԭ����</p>
        <p style="font-size: 32px;">���ʶ����׼ȷ��ԭ</p>
    </div>    
    `);
    const [htmlContent_demo, setHtmlContent_demo] = useState(`
    <div style="color: gray; display: flex; justify-content: center; align-items: center; flex-direction: column; margin-top: 200px;">
        <p style="font-size: 32px;">ͼƬ��ʾ����</p>
        <p style="font-size: 32px;">����·���Ӱ������ͼƬ</p>
    </div>    
    `);
    const [htmlContent_formula, setHtmlContent_formula] = useState(``);
    const editableRef = useRef(null);

    //latexת��ʽ
    const renderLaTeX = (latex) => {
        return ReactDOMServer.renderToString(<InlineMath math={latex} errorColor={'#cc0000'} />);
    };
    
    // �� OCR ����ת��Ϊ HTML ����  
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

    // ����htmlContent�ı仯��ÿ��htmlContent����ʱ��������Ⱦ���
    useEffect(() => {
        // ���������ִ����htmlContent�йص������߼�
    }, [htmlContent]);
    
    // �������ݱ༭��ɺ���¼�
    const handleBlur = () => {
        // ��ȡ�ɱ༭Ԫ�صĵ�ǰ����
        const editedHtml = editableRef.current.innerHTML;
        setHtmlContent(editedHtml);

        // ���� OCR ����
        let updatedOcrData = { ...ocrData };
        updatedOcrData= Array.from(editableRef.current.children).map((element,index)=> {
            const type = element.getAttribute('data-type');
            const position =ocrData[index].position;
            const text = type === "formula"? ocrData[index].text:element.innerHTML;
            const score = ocrData[index].score;
            return { position, text, type,score };
        });
        console.log(updatedOcrData);
        const currentDataList = [...dataList]; // ʹ����չ�������������

        // �޸�����Ϊ 0 ��Ԫ��
        if (currentDataList.length > 0) {
            const updatedElement = { ...currentDataList[currentIndex] }; // ʹ����չ���������Ԫ�ظ���
             // ������� updatedElement �����޸�
            updatedElement.data =updatedOcrData;
            // ���޸ĺ��Ԫ�طŻ�������
            currentDataList[currentIndex] = updatedElement;
            // ����״̬
            setDataList(currentDataList);
        }
        console.log(updatedOcrData);
        setOcrData(updatedOcrData);
    };


    //-------------ͼƬѡ���ǰ��˽���---------------
    // ��ͼƬ�� URL ת�����ļ�
    async function urlToBlob(url) {
      const response = await fetch(url);
      const blob = await response.blob();
      return blob;
    }
    

    //����ͼƬ����¼�
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
    
    //ͼƬ�ϴ�����
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
            //������˷�������
            .then(response => response.json())
            .then(Data => {
                console.log(Data);
                const data = [...Data].sort((a, b) => {
                    // ȷ�� a �� b �� position ����
                    if (a.position && b.position) {
                      // ȷ�� position �еĵ�һ��Ԫ�ش���
                      if (a.position[0] && b.position[0]) {
                        // �Ƚ�������
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
                            return 0; // ���������Ҳ��ȣ�����0
                          }
                        }
                      }
                    }
                    return 0; // Ĭ�Ϸ���0�����Ը��ݾ����������
                  });
                  console.log(data);
                  const dataObj = { url, data };
                  dataList.push(dataObj);
                setIsUpload(false);
            })
        } catch (error) {
            console.error('��������', error);
        }
    }

      //����ʵ�֡�����������ʵ��
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
        console.log("ɾ��");
        // ��û�и�������index��ʱΪ-1
        if (highlightIndex != -1) {
          //����currentTextList
          ocrData.splice(highlightIndex, 1);
          const html = ocrData.map(item => {
            const { position, text, type } = item;
            const style = `position: absolute; top: ${position[0][1] * 100}%; left: ${position[0][0] * 100}%;`;
            const renderedText = type === 'formula' ? renderLaTeX(text) : text;
            return `<div style="${style}" data-type="${type}">${renderedText}</div>`;
        }).join('');
        console.log(html);
        setHtmlContent(html);
          //����dataList
          dataList[currentIndex].data.splice(highlightIndex, 1);
        }
        // �رյ���
        handleCancel();
    }
    //�ʴ���ʵ��
    const [messages, setMessages] = useState([
        {
          content: '��ã���ʲô���԰��������',
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
            {/* ͷ������ */}
            <Header style={{ backgroundColor: 'var(--semi-color-bg-1)' }}>
                <div>
                    <Nav mode="horizontal" defaultSelectedKeys={['Home']}>
                        {/* ͼ�� */}
                        <Nav.Header>
                            <IconSemiLogo style={{ height: '36px', fontSize: 36 }} />
                        </Nav.Header>
                        {/* ���ܼ� */}
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
                               OCR����ƽ̨
                            </span>
                        </span>
                        {/* �󲿹��ܼ� */}
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
                    {/* ͼƬչʾ���� */}
                    <div
                        style={{
                            borderRadius: '10px',
                            border: '1px solid var(--semi-color-border)',
                            height: '70%',
                            padding: '10px',
                            backgroundColor: 'white',
                            marginBottom: '10px',
                            position: 'relative', // ��Զ�λ

                        }}
                    >
                        {/* �ֽ��� */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '0',
                                left: '50%', // �����Ҷ԰��
                                height: '100%',
                                width: '6px', // �ֽ��߿��
                                backgroundColor: 'grey', // �ֽ�����ɫ 
                            }}
                        />
                        <div
                            style={{
                                width: '50%', // ���Ҷ԰�
                                height: '100%', // ��ȫ��丸����
                                display: 'inline-block', // ���ڿ鼶Ԫ��
                                verticalAlign: 'top', // ��������
                            }}
                        >
                            {/* ͼƬ�� */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '0',
                                    left: '0',
                                    width: '50%',
                                    height: '90%', // �ϲ���ռ��9
                                    backgroundColor: 'white', // ��ӷֽ���
                                    overflow: 'auto', // ��ӹ�����
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
                            {/* ������ */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    left: '0',
                                    width: '50%',
                                    height: '5%', // �²���ռ��1
                                    borderTop: '1px solid grey',
                                    backgroundColor: 'white', // �²���Ϊ��ɫ
                                   
                                }}
                            >
                                <Button type="secondary"onClick={resetMode1} ><IconFontColor /></Button>
                                <Button type="secondary"onClick={resetMode2}><IconMark /></Button>
                                <Button type="secondary"onClick={handleAdd}><IconPlus /></Button>
                                <input
                                    id="inputValue"
                                    defaultValue=""
                                    placeholder="0-1֮��,Ĭ��Ϊ1"
                                    title='0-1֮��,Ĭ��Ϊ1'
                                    type="text"
                                    className="placeholder-style"
                                    onChange={saveInputValue}
                                    value={confidenceThres}
                                />
                            </div>
                        </div>
                        <div
                            style={{
                                width: '50%', // ���Ҷ԰�
                                height: '100%', // ��ȫ��丸����
                                display: 'inline-block', // ���ڿ鼶Ԫ��
                                verticalAlign: 'top', // ��������
                            }}
                        >
                            {/* ���滹ԭ�� */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '0',
                                    bottom:'0',
                                    right: '-5px',
                                    width: '50%',
                                    height: '90%', // �ϲ���ռ��9
                                    overflow: 'auto', // ��ӹ�����
                                    backgroundColor: 'white', // ��ӷֽ���
                                }}
                                id = "demo"
                                ref={editableRef}
                                contentEditable={true}
                                onBlur={handleBlur}
                                dangerouslySetInnerHTML={{ __html: htmlContent }}
                             >
                              
                            </div>
                            {/* ������ */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    right: '0',
                                    width: '50%',
                                    height: '5%', // �²���ռ��1
                                    borderTop: '1px solid grey',
                                    backgroundColor: 'white', // �²���Ϊ��ɫ
                                    
                                }}
                            >
                                <div style={{ textAlign: 'right' }}>
                                    <Button type="secondary" onClick={change}>
                                        �л����ʴ���  
                                    </Button>
                                </div>
                            </div>
                            {/* �Ҳ����� */}
                        </div>
                    </div>
                    {/* �ϴ�ͼƬ���� */}
                    <div
                        style={{
                            borderRadius: '10px',
                            border: '1px solid var(--semi-color-border)',
                            height: '20%',
                            padding: '7px 20px',
                            paddingLeft: '40px', // ��߾�
                            paddingRight: '40px', // �ұ߾�
                            backgroundColor: 'white'
                        }}
                    >
                        <div
                            style={{
                                flex: '10', // �ϲ���ռ��9
                                backgroundColor: 'white', // �ϲ���͸��
                                paddingBottom: '15px',
                            }}
                        >
                            {/* �ϲ������� */}
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
                                flex: '1', // �²���ռ��1
                                backgroundColor: 'white', // �²���Ϊ��ɫ
                                padding: '10px 0',
                                display: 'flex',
                                justifyContent: 'flex-end', // ���ݿ���
                                borderTop: '1px solid grey',
                            }}
                        >
                            <Button type="secondary"onClick={exportToWord}>����Ϊpng/jpg</Button>
                            <Button type="secondary"onClick={convertToPDF}>����ΪPDF</Button>
                            <Button type="secondary"onClick={exportToWord}>����Ϊdocx/txt</Button>
                        </div>
                    </div>
            </Content>
            {/* β������ */}
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
                    <span style={{ marginRight: '24px' }}>ƽ̨�ͷ�</span>
                    <span>��������</span>
                </span>
            </Footer>
            <SideSheet title="�޸�" visible={visible} onCancel={handleCancel} placement='bottom' height={300}>
                <div className='modify-place' style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }} >
                    {/* �޸ĵ������ݲ��� */}
                    <p style={{ marginLeft: '200px', color: 'bslack', fontSize: '16px' }}>ͼƬ���ݣ�</p>
                    {currentIndex != -1 && ocrData[currentIndex].type === "formula" ? (
                        <div
                            id="show-part-picture" 
                            dangerouslySetInnerHTML={{ __html:htmlContent_formula }}
                        >
                        </div>) : 
                        <div id="show-part-picture" style={{ marginLeft: '20px' }}></div>}
                    {/* <div id="show-part-picture" style={{ marginLeft: '20px' }}></div> */}
                    <p style={{ marginLeft: '100px', color: 'black', fontSize: '16px' }}>ʶ���ı���</p>
                    <input type="text" className="ocr-input" value={text} onChange={handleSelectionChange} style={{ marginLeft: '20px', width: '200px' }}/>
                    <Button type="primary" size='middle' className="custom-button" onClick={() => handleOk()} style={{ marginLeft: '20px' }}><IconEdit /></Button>
                    <Button type="primary" size='middle' className="custom-button" onClick={() => handleDec()} style={{ marginLeft: '20px' }}>ɾ��</Button>
                </div>
            </SideSheet>
            <SideSheet title="�ʴ���" visible={chatVisible} onCancel={change}>
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
    padding: '100px !important', /* �������ҵļ�� */
    border: '1px solid #888', /* ��ɫ�߿� */
    borderRadius: '10px', /* Բ�� */
  };
export default App;
