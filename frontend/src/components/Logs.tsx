
import { useEffect, useState, useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"
import { XTerm } from '@pablo-lion/xterm-react';
import { FitAddon } from 'xterm-addon-fit';
import { SearchAddon } from 'xterm-addon-search';




interface StreamingLogsProps {
    projectId: string;
    isVisible: boolean;
    uploaderFinished?: boolean;
}
interface LogEntry {
    data: {
        message: string;
        timestamp: string;
        service: string;
    }
}

function StreamingLogs({ projectId, isVisible, uploaderFinished }: StreamingLogsProps) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);
    const [currentService, setCurrentService] = useState<'uploader' | 'deployer' |null>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<any>(null)
    const timestampRef = useRef<string>("");
    const fitAddonRef = useRef<FitAddon>(new FitAddon());
    const searchAddonRef = useRef<SearchAddon>(new SearchAddon());
    fitAddonRef.current.fit();


    useEffect(() => {
    const ws1 = new WebSocket("ws://localhost:3001");
    const ws2 = new WebSocket("ws://localhost:3002");
    ws1.onmessage = (event) => {
        const parsed: LogEntry = JSON.parse(event.data);
        contentRef.current.write(`\r\n${parsed.data.timestamp}   ${parsed.data.message}`);     
    }
    ws2.onmessage = (event) => {
        const parsed: LogEntry = JSON.parse(event.data);
        contentRef.current.write(`\r\n${parsed.data.timestamp}   ${parsed.data.message}`);     
    }
    ws1.onopen = () => {
        console.log("connected to the uploader websocket");
    }
    ws2.onopen = () =>{
        console.log("connected to the deployer websocket");
    }

    return () => {
        ws1.close();
        ws2.close();
    }


    }, [isVisible]);
    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      };
    
      useEffect(() => {
        scrollToBottom();
      }, [logs]);
    // ADD
// const CSI = '\x1b[';
// function normalizeForXterm(s: string): string {
//   let out = s;
//   // Clear to end of line when a lone \r is used to redraw the same line
//   out = out.replace(/\r(?!\n)/g, `\r${CSI}K`);
//   // Ensure logical lines advance (if the tool didn't send a newline)
//   if (!out.endsWith('\n')) out += '\r\n';
//   return out;
// }


    // useEffect(() => {
    //     if (!projectId || !isVisible) return;
    //     setError(null);
    //     if (!uploaderFinished) {
    //         setLogs([]);
    //     }
    //     if (eventSourceRef.current) {
    //         eventSourceRef.current.close();
    //         eventSourceRef.current = null;
    //     }
    //     if (uploaderFinished) {
    //         console.log("deployer started");
            
    //         const eventSource = new EventSource(`http://localhost:3001/logs/stream/${projectId}`);
    //         eventSourceRef.current = eventSource;

    //         eventSource.onopen = () => {
    //             setIsConnected(true);
    //             setError(null);
    //             setCurrentService('deployer');
    //         };
            
    //         eventSource.onmessage = (event) => {
    //             try{

    //                 const parsed: LogEntry = JSON.parse(event.data);
    //                 console.log(normalizeForXterm(parsed.data.message));
    //                 contentRef.current.write(normalizeForXterm(parsed.data.message));
    //                 console.log(contentRef.current);
                    
    //                 setLogs(prev => [...prev, {data: {message: parsed.data.message, timestamp: parsed.data.timestamp, service: 'deployer'}}]);
    //             }catch(error){
    //                 console.error("Error parsing log data:", error);
    //             }
    //         };

    //         eventSource.onerror = (error) => {
    //             console.error("deployer Event source error:", error);
    //             setIsConnected(false);
    //             eventSource.close();
    //             eventSourceRef.current = null;
    //         };

    //     }
    //     else {
    //         console.log("uploader started");
            
    //         const eventSource = new EventSource(`http://localhost:3000/logs/stream/${projectId}`);
    //         eventSourceRef.current = eventSource;
    
    //         eventSource.onopen = () => {
    //             setIsConnected(true);
    //             setError(null);
    //             setCurrentService('uploader');
    //         };
    
    //         eventSource.onmessage = (event) => {
    //             try{
    //                 const parsed: LogEntry = JSON.parse(event.data);
    //                 console.log(normalizeForXterm(parsed.data.message));
    //                 contentRef.current.write(normalizeForXterm(parsed.data.message));
    //                 setLogs(prev => [...prev, {data: {message: parsed.data.message, timestamp: parsed.data.timestamp, service: 'uploader'}}]);
    //             }catch(error){
    //                 console.error("Error parsing log data:", error);
    //             }
    //         };
    
    //         eventSource.onerror = (error) => {
    //             console.error("uploader Event source error:", error);
    //             setError("Error fetching logs. Please refresh the page.");
    //             setIsConnected(false);
    //             eventSource.close();
    //             eventSourceRef.current = null;
    //         }
    //     };

    //     return () => {
    //         if (eventSourceRef.current) {
    //             eventSourceRef.current.close();
    //             eventSourceRef.current = null;
    //         }
    //     };
    // }, [projectId, isVisible, uploaderFinished]);

    if (!isVisible) return null;

    return (
        <>
        <div className="h-96 w-full text-left text-xs">
        <XTerm className=""  ref={contentRef} addons={[fitAddonRef.current,searchAddonRef.current]} options={{ 

    lineHeight: 1.2,
    fontSize: 10,
    fontFamily: 'Fira Code, Monaco, monospace',
    fontWeight: 'normal',
    fontWeightBold: 'bold',
    letterSpacing: 0,
    cursorBlink: true,
    cursorStyle: 'block',
    cursorWidth: 1,
    allowTransparency: true,
    scrollback: 1000,
    scrollOnUserInput: false,
    disableStdin: true,
    minimumContrastRatio: 4.5, // For better accessibility
    convertEol: true,
    theme: {
        background: '#272822',
        foreground: '#f8f8f2',
        cursor: '#f8f8f0',
        black: '#272822',
        red: '#f92672',
        green: '#a6e22e',
        yellow: '#f4bf75',
        blue: '#66d9ef',
        magenta: '#ae81ff',
        cyan: '#a1efe4',
        white: '#f8f8f2'
      }
  }}  />
  </div>
      {/* <Accordion type="single" collapsible className="mt-5 w-full">
      <AccordionItem value="item-1">
          <AccordionTrigger className="text-lg text-white !bg-black !rounded-none">
              Build Logs
          </AccordionTrigger>
          <AccordionContent>
              <div className="bg-black text-green-400 p-4 font-mono text-sm overflow-y-auto relative h-80 border border-gray-600">
                  {logs.map((logEntry, index) => (
                      <div key={index} className="hover:bg-gray-800 px-1 rounded flex">
                          <span className="text-blue-400 w-24 flex-shrink-0 text-right mr-3">
                              {new Date(logEntry.data.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="flex-1 text-green-400">
                              {logEntry.data.message}
                          </span>
                      </div>
                  ))}
                  <div ref={logsEndRef} />
              </div>
          </AccordionContent>
      </AccordionItem>
  </Accordion> */}
  </>
      );
    }
    
    export default StreamingLogs;