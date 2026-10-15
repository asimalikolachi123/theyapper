import Platform from "../../Platform";
export default async function Conversation({params}:{params:Promise<{username:string}>}){const {username}=await params;return <Platform page="messages" param={username}/>;}
