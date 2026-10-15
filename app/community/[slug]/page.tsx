import Platform from "../../Platform";
export default async function Community({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <Platform page="community" param={slug}/>;}
