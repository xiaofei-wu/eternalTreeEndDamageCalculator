importScripts("./main.js")
onmessage = (e) => {
    let data = e.data
    switch (data.method) {
        case 'startCalc':
            startCalc(data.data)
            break;
        default:
            postMessage('Unknown command: ' + data.method);
    }
}
var defaultScene=null
var results=[]
var workers=[]
var count={calcing:0,complete:0,total:0}
function startCalc(currentScene){
    results=[]
    workers=[]
    count={calcing:0,complete:0,total:0}
    defaultScene=currentScene
    createSubWorker(currentScene)
    // mainCalc.calcTree()
    // postMessage({method:"percentageUpdate",data:{percentage:0/100}})
    // postMessage({method:"calcComplete",data:results})
}
function createSubWorker(currentScene,newSituations=[]){
    let subWork = new Worker("./subWorker.js")
    let id=new Date().getTime()
    subWork.postMessage({ method: "initCalc", data: {currentScene,newSituations,id} })
    subWork.onmessage = (e) => {
        let data = e.data
        switch (data.method) {
            case 'calcComplete':
                dealResults(data.data.results,data.data.id)
                break;
            case 'createSubWorker':
                createSubWorker(defaultScene,data.data.newSituations)
                break;
            default:
                console.log();
        }
    }
    workers.push({id,work:subWork,complete:false,calcing:false})
    count.total++
    startNewCalc()
    // postMessage({method:"percentageUpdate",data:count})
    console.log("线程数："+count.complete+"/"+count.total)
}
function dealResults(subResults,id){
    results=results.concat(subResults).sort((a,b)=>{return Number(a.health)-Number(b.health)}).slice(0,100)
    let index=workers.findIndex((worker)=>{return worker.id==id})
    if(index>-1){
        workers[index].complete=true
        count.complete++
        workers[index].work.terminate()
        count.calcing--
        startNewCalc()
    }
    // postMessage({method:"percentageUpdate",data:count})
    console.log("线程数："+count.complete+"/"+count.total)
    if(!workers.find((worker)=>{return !worker.complete})){
        console.log(results)
        postMessage({method:"calcComplete",data:results})
        workers=[]
    }
}
function startNewCalc(){
    // console.log("当前运行线程数："+count.calcing)
    postMessage({method:"percentageUpdate",data:count})
    if(count.calcing<10){
        let lastWorker=workers.findLast((worker)=>{return !worker.complete&&!worker.calcing})
        if(lastWorker){
            lastWorker.work.postMessage({ method: "startCalc"})
            lastWorker.calcing=true
            count.calcing++
        }
    }
}