
import { useEffect, useState, useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"


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

    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      };
    
      useEffect(() => {
        scrollToBottom();
      }, [logs]);
    

    useEffect(() => {
        if (!projectId || !isVisible) return;
        setError(null);
        if (!uploaderFinished) {
            setLogs([]);
        }
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        if (uploaderFinished) {
            console.log("deployer started");
            
            const eventSource = new EventSource(`http://localhost:3001/logs/stream/${projectId}`);
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                setIsConnected(true);
                setError(null);
                setCurrentService('deployer');
            };
            
            eventSource.onmessage = (event) => {
                try{

                    const parsed: LogEntry = JSON.parse(event.data);
                    console.log(parsed.data.message);
                    setLogs(prev => [...prev, {data: {message: parsed.data.message, timestamp: parsed.data.timestamp, service: 'deployer'}}]);
                }catch(error){
                    console.error("Error parsing log data:", error);
                }
            };

            eventSource.onerror = (error) => {
                console.error("deployer Event source error:", error);
                setIsConnected(false);
                eventSource.close();
                eventSourceRef.current = null;
            };

        }
        else {
            console.log("uploader started");
            
            const eventSource = new EventSource(`http://localhost:3000/logs/stream/${projectId}`);
            eventSourceRef.current = eventSource;
    
            eventSource.onopen = () => {
                setIsConnected(true);
                setError(null);
                setCurrentService('uploader');
            };
    
            eventSource.onmessage = (event) => {
                try{
                    const parsed: LogEntry = JSON.parse(event.data);
                    console.log(parsed);
                    setLogs(prev => [...prev, {data: {message: parsed.data.message, timestamp: parsed.data.timestamp, service: 'uploader'}}]);
                }catch(error){
                    console.error("Error parsing log data:", error);
                }
            };
    
            eventSource.onerror = (error) => {
                console.error("uploader Event source error:", error);
                setError("Error fetching logs. Please refresh the page.");
                setIsConnected(false);
                eventSource.close();
                eventSourceRef.current = null;
            }
        };

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [projectId, isVisible, uploaderFinished]);

    if (!isVisible) return null;

    return (
      <Accordion type="single" collapsible className="mt-5 w-full">
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
  </Accordion>
      );
    }
    
    export default StreamingLogs;