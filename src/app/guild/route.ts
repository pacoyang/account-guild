import { NextResponse, type NextRequest } from 'next/server'
import { recoverMessageAddress } from 'viem'

let guildList: any[] = []
let guildMap: {[id: number]: any} = {}

const getGuildList = async () => {
  const res = await fetch('https://api.guild.xyz/v1/guild', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  const data = await res.json()
  return data
}

function findIdByUrlName(urlNames: string[], guildList: any[]): number[] {
  const ids = []
  for (const guild of guildList) {
    if (urlNames.includes(guild.urlName)) {
      ids.push(guild.id)
    }
  }
  return ids
}

const getGuildDetail = async (id: number) => {
  if (guildMap[id]) {
    return guildMap[id]
  }
  const res = await fetch(`https://api.guild.xyz/v1/guild/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  const data = await res.json()
  guildMap[id] = data
  return data
}

const getGuildAccess = async (id: number, address: string) => {
  const res = await fetch(`https://api.guild.xyz/v1/guild/access/${id}/${address}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  const data = await res.json()
  return data
}

export async function POST(request: NextRequest) {
  const { message, signature } = await request.json()
  const recoveredAddress = await recoverMessageAddress({
    message,
    signature,
  })
  const urlNames = message.split(' ')
  if (guildList.length === 0) {
    guildList = await getGuildList()
  }
  const ids = findIdByUrlName(urlNames, guildList)
  const items: any[] = []
  for (const id of ids) {
    const [detail, access] = await Promise.all([
      getGuildDetail(id),
      getGuildAccess(id, `${recoveredAddress}`)
    ])
    if (detail && access) {
      const roles = access
       .filter((accessItem: any) => detail.roles.some((roleItem: any) => roleItem.id === accessItem.roleId))
       .map((accessItem: any) => {
         const role = detail.roles.find((roleItem: any) => roleItem.id === accessItem.roleId)
         return {
           ...role,
           access: accessItem.access
         }
        })
      items.push({
        id,
        roles,
        name: detail.name,
        urlName: detail.urlName,
      })
    }
  }
  console.info(items)
  return NextResponse.json({
    items,
  })
}

