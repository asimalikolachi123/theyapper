import Platform from "../../Platform";
export default async function Conversation({params}:{params:{username:string}}){const {username}=params;return <Platform page="messages" param={username}/>;}
