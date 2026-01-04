// import { clerkClient } from "@clerk/nextjs/server"

// const authAdmin = async (userId) =>{
//     try {
//         if(!userId) return false
//         const client = await clerkClient()
//         const user = await client.users.getUser(userId)
//         return process.env.ADMIN_EMAIL.split(',').includes(user.emailAddresses[0].emailAddress)
//     } catch (error) {
//         console.error(error)
//         return false
//     }
// }
// export default authAdmin

import { currentUser } from "@clerk/nextjs/server"
// this function checks whethere the currently logged user is admin or not
const authAdmin = async (userId) => {
  try {
    if (!userId) return false
    if (!process.env.ADMIN_EMAIL) return false

    const user = await currentUser()
    if (!user) return false

    return process.env.ADMIN_EMAIL
      .split(",")
      .includes(user.emailAddresses[0].emailAddress)

  } catch (error) {
    console.error("authAdmin error:", error)
    return false
  }
}

export default authAdmin
