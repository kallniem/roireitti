import InstallPrompt from "../components/InstallPrompt";

function HomePage() {
    return (
        <div
        className="flex-column justify-center align-center"
        style={{
        width: "100%",
        height: "100%",
        }}
        >
            <div style={{maxWidth: "40rem", textAlign: "center"}}>
                <h1>Rovaniemen pyöräreitit<br></br>yhdessä paikassa</h1>
                <p>RoiReitti on Rovaniemen pyöräreittien tietopankki, joka tarjoaa kattavat tiedot reiteistä, niiden vaativuudesta ja pituudesta. Tutustu reitteihin, suunnittele oma pyöräretkesi ja nauti Rovaniemen upeista maisemista!</p>
                <p>Suuntaa 'Reitit' tai 'Kartta' -näkymään selataksesi reittejä.</p>
            </div>
            <InstallPrompt />
        </div>
    )
}

export default HomePage;