import Platform from "../../Platform";
export default async function Community({params}:{params:{slug:string}}){const {slug}=params;return <Platform page="community" param={slug}/>;}
