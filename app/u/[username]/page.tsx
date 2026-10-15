import Platform from "../../Platform";
export default async function Profile({params}:{params:{username:string}}){const {username}=params;return <Platform page="profile" param={username}/>;}
