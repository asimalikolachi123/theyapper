import Platform from "../../Platform";
export default async function Profile({params}:{params:Promise<{username:string}>}){const {username}=await params;return <Platform page="profile" param={username}/>;}
