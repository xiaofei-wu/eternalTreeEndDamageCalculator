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
function startCalc(currentScene){
    results=[]
    workers=[]
    defaultScene=currentScene
    createSubWorker(currentScene)
    // mainCalc.calcTree()
    // postMessage({method:"percentageUpdate",data:{percentage:0/100}})
    // postMessage({method:"calcComplete",data:results})
}
function createSubWorker(currentScene,newSituations=[]){
    let subWork = new Worker("./subWorker.js")
    let id=new Date().getTime()
    subWork.postMessage({ method: "startCalc", data: {currentScene,newSituations,id} })
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
    console.log("线程数："+workers.filter((work)=>{return work.complete}).length+"/"+workers.length)
}
function dealResults(subResults,id){
    results=results.concat(subResults).sort((a,b)=>{return Number(a.health)-Number(b.health)}).slice(0,100)
    let index=workers.findIndex((worker)=>{return worker.id==id})
    if(index>-1){
        workers[index].complete=true
        workers[index].work.terminate()
        // let nextIndex=workers.findIndex((worker)=>{return worker.id==id})
    }
    console.log("线程数："+workers.filter((work)=>{return work.complete}).length+"/"+workers.length)
    if(!workers.find((worker)=>{return !worker.complete})){
        console.log(results)
        postMessage({method:"calcComplete",data:results})
        workers=[]
    }
}