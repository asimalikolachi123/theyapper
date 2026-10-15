import Platform from "../../Platform";
export default async function Hashtag({params}:{params:Promise<{tag:string}>}){const {tag}=await params;return <Platform page="hashtag" param={decodeURIComponent(tag)}/>;}
