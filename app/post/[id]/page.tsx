import Platform from "../../Platform";
export default async function PostDetail({params}:{params:{id:string}}){const {id}=params;return <Platform page="post" param={id}/>;}
