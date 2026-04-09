import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

const deviceTypes = [
  {
    id: randomUUID(),
    name: '高性能服务器',
    modelName: 'Dell PowerEdge R740',
    location: '机房A-机柜01',
    owner: '系统管理员',
    description: '用于大规模计算任务的高性能服务器',
  },
  {
    id: randomUUID(),
    name: 'GPU工作站',
    modelName: 'NVIDIA DGX Station',
    location: '机房A-机柜02',
    owner: '系统管理员',
    description: '配备高性能GPU的AI训练工作站',
  },
  {
    id: randomUUID(),
    name: '存储服务器',
    modelName: 'NetApp AFF A250',
    location: '机房B-机柜01',
    owner: '系统管理员',
    description: '大容量网络存储设备',
  },
  {
    id: randomUUID(),
    name: '开发工作站',
    modelName: 'Dell Precision 5820',
    location: '研发区-工位区',
    owner: '研发部门',
    description: '软件开发人员日常开发工作站',
  },
  {
    id: randomUUID(),
    name: '测试服务器',
    modelName: 'HPE ProLiant DL380',
    location: '机房B-机柜02',
    owner: '测试部门',
    description: '用于软件测试和CI/CD流水线',
  },
]

async function main() {
  console.log('开始填充设备类型数据...')

  for (const type of deviceTypes) {
    const created = await prisma.device_types.upsert({
      where: { name: type.name },
      update: {
        modelName: type.modelName,
        location: type.location,
        owner: type.owner,
        description: type.description,
      },
      create: type,
    })
    console.log(`✅ 设备类型: ${created.name} (${created.id})`)
  }

  console.log(`\n🎉 成功创建/更新 ${deviceTypes.length} 个设备类型`)
}

main()
  .catch((e) => {
    console.error('填充设备类型数据失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })