import Platform from "../../Platform";
export default async function PostDetail({params}:{params:Promise<{id:string}>}){const {id}=await params;return <Platform page="post" param={id}/>;}
