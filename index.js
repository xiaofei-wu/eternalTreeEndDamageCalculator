
var work = new Worker("./worker.js")
var app = new Vue({
    el: '#app',
    data: () => {
        return {
            skillTypes: ["调律爆裂","调律", "共鸣", "虚数体", "自动炮（调律）", "自动炮（共鸣）"],
            scenes: [],
            currentScene: {
                skillList: [],
                condition: {
                    health: 0,
                    targetHealth:1,
                    burstStatus:false,
                },
                results: [],
            },
            dialogVisible: false,
            formData: {},
            predefineColors:["#000000","#FF0000","#00FF00","#0000FF"],
            rules: {
                name: [{ required: true, message: '请输入技能名称', trigger: 'blur' }],
                damage: [{ required: true, message: '请输入技能伤害', trigger: 'blur' }],
                damageAfterBurst: [{ required: true, message: '请输入调律爆裂后技能伤害', trigger: 'blur' }],
                type: [{ required: true, message: '请选择技能类型', trigger: 'blur' }],
                count: [{ required: true, message: '请输入', trigger: 'blur' }],
                maxCount: [{ required: true, message: '请输入', trigger: 'blur' }],
                maxTotalCount: [{ required: true, message: '请输入', trigger: 'blur' }],
                autoDamageCount: [{ required: true, message: '请输入', trigger: 'blur' }],
                autoDamageTriggerCount: [{ required: true, message: '请输入', trigger: 'blur' }],
            },
            formDisabled: true,
            calcing: false,
            percentage: 0,
            count:{calcing:0,complete:0,total:0},
            resultDialog:false,
            currentPath:[],
            workers:[],
            startTime:null,
            endTime:null,
            multipleSelection:[],
            warningLock:false,
        }
    },
    computed:{
    },
    mounted() {
        if (window.localStorage.getItem('skillList')) {
            this.currentScene.skillList = JSON.parse(window.localStorage.getItem('skillList')).map(newSkill => {
                let formatSkill=new skill()
                return {...formatSkill,...newSkill}
            });
        }
        if (window.localStorage.getItem('condition')) {
            this.currentScene.condition = JSON.parse(window.localStorage.getItem('condition'))
        }
    },
    methods: {
        percentageFormat(val){
            return `${this.count.complete}/${this.count.total} 剩余：${this.count.total-this.count.complete}`
        },
        format(val){
            return val.toString().replace(/\B(?=(\d{3})+$)/g,',')
        },
        numberFormat (row, column, cellValue) {
            cellValue += ''
            if (!cellValue.includes('.')) cellValue += '.'
            return cellValue.replace(/(\d)(?=(\d{3})+\.)/g, function ($0, $1) {
              return $1 + ','
            }).replace(/\.$/, '')
        },
        skillNameFormat (val){
            // console.log(row)
            let skill=this.currentScene.skillList.find(item=>{return item.id==val})
            return skill?skill.name:""
        },
        skillColorFormat (val){
            // console.log(row)
            let skill=this.currentScene.skillList.find(item=>{return item.id==val})
            return skill?skill.color:""
        },
        handleSelectionChange(val) {
            this.multipleSelection = val;
        },
        importSkills(){
            navigator.clipboard.readText()
                .then(text => {
                    let data=JSON.parse(text)
                    if(!data.skillList||!data.condition){
                        this.$message({
                            message: '无法获取或解析剪切板内容',
                            type: 'error'
                        });
                        return;
                    }
                    data.skillList=data.skillList.map(newSkill => {
                        let formatSkill=new skill()
                        return {...formatSkill,...newSkill}
                    });
                    this.currentScene={...this.currentScene,...data}
                    this.$message({
                        message: '导入成功',
                        type: 'success'
                    });
                })
                .catch(err => {
                    this.$message({
                        message: '无法获取或解析剪切板内容',
                        type: 'error'
                    });
                    console.error('无法获取或解析剪切板内容:', err);
                });
        },
        exportSkills(){
            navigator.clipboard.writeText(JSON.stringify({skillList:this.currentScene.skillList,condition:this.currentScene.condition}))
                .then(() => {
                    this.$message({
                        message: '已导出至剪切板',
                        type: 'success'
                    });
                })
                .catch(() => {
                    this.$message({
                        message: '导出失败',
                        type: 'error'
                    });
                });
        },
        viewSkill(row) {
            this.formData = row
            this.formDisabled = true
            this.dialogVisible = true
        },
        editSkill(row) {
            this.formData = JSON.parse(JSON.stringify(row))
            this.formDisabled = false
            this.dialogVisible = true
        },
        delSkill(row, index) {
            this.currentScene.skillList.splice(index, 1);
        },
        addSkill() {
            this.formData = new skill()
            this.formDisabled = false
            this.dialogVisible = true
        },
        submitForm() {
            this.$refs["form"].validate((valid) => {
                if (valid) {
                    let index = this.currentScene.skillList.findIndex(item => { return item.id == this.formData.id })
                    if (index != -1) {
                        this.currentScene.skillList[index] = this.formData
                    } else {
                        this.currentScene.skillList.push(this.formData)
                    }
                    this.dialogVisible = false
                } else {
                    return false;
                }
            });
        },
        startCalc() {
            window.localStorage.setItem('skillList', JSON.stringify(this.currentScene.skillList));
            window.localStorage.setItem('condition', JSON.stringify(this.currentScene.condition));
            this.startTime=new Date().getTime()
            this.calcing=true
            let calcSkillList=this.currentScene.skillList.filter(singleSkill=>{
                return this.multipleSelection.findIndex(item=>item.id==singleSkill.id)>-1
            })
            if(calcSkillList.length>0){
                work.postMessage({ method: "startCalc", data: {...this.currentScene,skillList:calcSkillList} })
            }else{
                work.postMessage({ method: "startCalc", data: this.currentScene })
            }
            work.onmessage = (e) => {
                let data = e.data
                switch (data.method) {
                    case 'percentageUpdate':
                        this.percentageUpdate(data.data)
                        break;
                    case 'calcComplete':
                        this.currentScene.results = data.data
                        this.endTime=new Date().getTime()
                        this.$message({
                            message: `已计算完毕，耗时${(this.endTime-this.startTime)/1000}s`,
                            type: 'success'
                        });
                        console.log(`耗时：${(this.endTime-this.startTime)/1000}s`)
                        this.calcing=false
                        break;
                    default:
                        console.log(e);
                }
            }
        },
        percentageUpdate(count){
            // this.percentage = Number((Number(count.complete)/Number(count.total)*100).toFixed(2))
            this.count=count
            if(this.count.total-this.count.complete>20&&!this.warningLock){
                this.$message({
                    message: '当前计算复杂度较高，可能耗费较多时间，请耐心等待或简化计算条件',
                    type: 'warning'
                });
                this.warningLock=true
                setTimeout(()=>{this.warningLock=false},10000)
            }
        },
        viewResult(singleResult) {
            this.currentPath=singleResult.currentPath
            this.resultDialog=true
        }
    },
})
