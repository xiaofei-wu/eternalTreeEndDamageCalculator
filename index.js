var work
var app = new Vue({
    el: '#app',
    data: () => {
        return {
            skillTypes: ["调律", "共鸣", "虚数体", "自动炮（调律）", "自动炮（共鸣）"],
            scenes: [],
            currentScene: {
                skillList: [],
                condition: {
                    health: 0,
                },
                results: [],
            },
            dialogVisible: false,
            formData: {},
            rules: {
                name: [{ required: true, message: '请输入技能名称', trigger: 'blur' }],
                damage: [{ required: true, message: '请输入技能伤害', trigger: 'blur' }],
                type: [{ required: true, message: '请选择技能类型', trigger: 'blur' }],
                count: [{ required: true, message: '请输入', trigger: 'blur' }],
                maxCount: [{ required: true, message: '请输入', trigger: 'blur' }],
                maxTotalCount: [{ required: true, message: '请输入', trigger: 'blur' }]
            },
            formDisabled: true,
            calcing: true,
            percentage: 0,
        }
    },
    mounted() {
        if (window.localStorage.getItem('skillList')) {
            this.currentScene.skillList = JSON.parse(window.localStorage.getItem('skillList'))
        }
    },
    methods: {
        viewSkill(row) {
            this.formData = row
            this.formDisabled = true
            this.dialogVisible = true
        },
        editSkill(row) {
            this.formData = row
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
            work = new Worker("./worker.js")
            work.postMessage({ method: "startCalc", data: this.currentScene })
            work.onmessage = (e) => {
                let data = e.data
                switch (data.method) {
                    case 'percentageUpdate':
                        this.percentageUpdate(data.data.percentage)
                        break;
                    case 'calcComplete':
                        this.currentScene.results = data.data
                        break;
                    default:
                        console.log();
                }
            }
            return
            let calc123 = new calc(this.currentScene.skillList, this.currentScene.condition.health)
            this.calcing = true
            calc123.calcTree((percentage) => { this.percentage = percentage })
            this.currentScene.results = calc123.getResult()
        },
        percentageUpdate(percentage){
            this.percentage = Number(percentage)
        },
        viewResult() {

        }
    },
})
