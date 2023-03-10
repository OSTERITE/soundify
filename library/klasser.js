class Spor{

    constructor(artist, tittel, bildefil, lydfil, id, path_bilde_lyd){
        this.artist = artist
        this.tittel = tittel
        this.bildefil = bildefil
        this.lydfil = lydfil
        this.path_bilde_lyd = path_bilde_lyd
        this.id = id
    }

    //spiller sangen om den ikke spiller, pauser om den spilles
    spill_pause_sang(){
        const lyd_element = document.getElementById(this.lydfil);
        if (lyd_element.paused){lyd_element.play();}
        else{lyd_element.pause();}
    }
    
    //sangen sin tid resetes til null og den pauses, kan brukes når en ny sang spilles av og den tidligere sangen sin spilltid skal resetes
    reset_sang(){
        const sang_element = document.getElementById(this.lydfil);
        sang_element.pause();
        sang_element.currentTime = 0;
    }

    //sangen sin tid resetes til null
    reset_tid(){
        const sang_element = document.getElementById(this.lydfil);
        sang_element.currentTime = 0;
    }
}
class Spilleliste{

    constructor(){
        this.spilleliste_navn = ''
        this.sanger = []
        this.nåværende_lydspor_id = 0
        this.spill_modus = 'sekvensiell'
    
        //Husker de tidligere spilte sanger, kun for tilfeldig spill modus
        this.spilte_sanger_indexer = []
        //id for hvor i tidligere spilte sanger arrayen vi er
        this.spilte_sanger_nåværende_index = -1
        //forteller om sangen som spiller er del av this.spilte_sanger_indexer
        this.gamle_sanger = false

        //setIntervall id som endrer progressbar-en til sangen
        this.sjekk_tid_id
    }

    async lastinn_fra_json(path_json, spilleliste_navn){
        //Kort sagt: Spilleliste objekter kan kun inneholde informasjonen til en spilleliste.
        //Lengre: I tilfelle en ny spilleliste lastes inn for klass objektet som lages,
        //nullstilles informajsonen til spillelisten, det sikrer at det kun være 
        //en spilleliste sitt innhold i hvert "Spilleliste" klasse objekt som lages.
        //snakker om disse 5 variablene
        this.sanger = []
        this.nåværende_lydspor_id = 0
        this.spilte_sanger_indexer = []
        this.spilte_sanger_nåværende_index = -1
        this.gamle_sanger = false

        this.spilleliste_navn = spilleliste_navn.toLowerCase().trim()
        this.path_spilleliste = `spillelister/${this.spilleliste_navn}`

        this.innhold = await lastInn(`${path_json}${this.spilleliste_navn}.json`);
        this.innhold_objekt = JSON.parse(this.innhold)

        //Lagrer informajsonen fra JSON filen som et klasse objekt (Spor klassen) og legger klass object inn i en array (sanger)
        for (let i = 0; i < this.innhold_objekt.length; i++) {
            const sang_info = new Spor(this.innhold_objekt[i].artist,
                this.innhold_objekt[i].tittel,
                this.innhold_objekt[i].bildefil,
                this.innhold_objekt[i].lydfil,
                this.innhold_objekt[i].id,
                this.path_spilleliste
                )
            this.sanger.push(sang_info)
        }
        this.lag_nettside()
    }

    spill_sang_spilleliste(sang_index){
        //om spill_modus er satt til å spille sekvensiell øker sang index med 1 (eller til 0)
        if (this.spill_modus === 'sekvensiell'){
            this.spill_sekvensiell(sang_index)
        }
        //om sang modus er tilfeldig spilles av en tilfeldig sang(som ikke er samme sang som allerede spiller)
        else if (this.spill_modus === 'tilfeldig'){
            this.spill_random(sang_index)
        }
    }

    spill_sekvensiell(sang_index){
        //om slutten av spillelisten er nådd, begynner den på nytt, ellers er det bare sekvensiell som spilles
        if (sang_index === this.sanger.length){ 
            sang_index = 0
        }
        else if (sang_index === -1){
            sang_index = this.sanger.length -1
        }
        this.nåværende_lydspor_id = sang_index
        this.reset_nesten_alle_sanger(this.nåværende_lydspor_id)
        this.sanger[this.nåværende_lydspor_id].spill_pause_sang()
    }

    spill_random(gammelt_lydspor_id){
        //random tall fra og med 0 til og med lengden på playlisten
        //velger ett nytt tilfedlig tall om det er det samme som forrige
        let ny_lydspor_id = Math.floor(Math.random() * this.sanger.length);
        while (ny_lydspor_id == gammelt_lydspor_id){
            ny_lydspor_id = Math.floor(Math.random() * this.sanger.length);
        }
        this.nåværende_lydspor_id = ny_lydspor_id
        this.reset_nesten_alle_sanger(ny_lydspor_id)
        this.sanger[this.nåværende_lydspor_id].spill_pause_sang()   
    }

    endre_spill_modus(nytt_modus){
        if (nytt_modus === 'sekvensiell'){
            this.spill_modus = 'sekvensiell'
            this.modus_knapp.innerHTML = 'Sekvensiell'
            this.modus_knapp.style.backgroundColor = '#800020'
        }
        else if (nytt_modus === 'tilfeldig'){
            this.spill_modus = 'tilfeldig'
            this.modus_knapp.innerHTML = 'Tilfeldig'
            this.modus_knapp.style.backgroundColor = 'blue'
        }
    }

    reset_nesten_alle_sanger(unntak){
        for (let i = 0; i < this.sanger.length; i++) {
            if (i === unntak){
                continue
            }
            this.sanger[i].reset_sang();
        }
    }

    lag_nettside(){
        //stopper den gjentagende sjekken av hvor i sangen vi er.
        clearInterval(this.sjekk_tid_id)
        //placeholder for spilleliste sang elemente som blir dynamiskt laget (og bunnbar-en)
        const kontainer_spilleliste_innhold = document.getElementById('kontainer_spilleliste_innhold')
        const kontainer_avspilling_knapper = document.getElementById("kontainer_avspilling_knapper")
        //kontainer_navigasjon er kontainer for spillelister og "Tilbake" knappen
        const kontainer_navigasjon = document.getElementById("kontainer_navigasjon")
        const spillelister_element = document.querySelectorAll('.spilleliste')
        const back_knapp_fjern_innhold = [kontainer_avspilling_knapper, kontainer_spilleliste_innhold]

        this.lag_avspilling_knapper(kontainer_avspilling_knapper)
        this.lag_innhold_kort(kontainer_spilleliste_innhold)

        for (let i = 0; i < spillelister_element.length; i++) { spillelister_element[i].remove() }
        this.lag_tilbake_knapp(kontainer_navigasjon, spillelister_element, back_knapp_fjern_innhold)
    }

    lag_avspilling_knapper(kontainer){

        //lager spill av knappen
        const spillav = document.createElement("button");
        spillav.innerHTML = 'Spill av'
        spillav.id = "spill_knapp";
        spillav.addEventListener("click", () => { 
            this.spill_sang_spilleliste(this.nåværende_lydspor_id) 
        });

        //lager knappen hvor man kan endre avspillings modus
        this.modus_knapp = document.createElement("button");
        this.modus_knapp.id = ("modus_knapp");
        this.modus_knapp.addEventListener("click", () => {
            if (this.spill_modus === 'sekvensiell'){
                this.endre_spill_modus('tilfeldig');
            }
            else if (this.spill_modus === 'tilfeldig'){
                this.endre_spill_modus('sekvensiell');
            }
        });

        if (this.spill_modus === 'sekvensiell'){
            this.modus_knapp.innerHTML = 'Sekvensiell'
            this.modus_knapp.style.backgroundColor = '#800020'
        }
        else if (this.spill_modus === 'tilfeldig'){
            this.modus_knapp.innerHTML = 'Tilfeldig'
            this.modus_knapp.style.backgroundColor = 'blue'
        }

        kontainer.appendChild(spillav);
        kontainer.appendChild(this.modus_knapp);
    }

    lag_tilbake_knapp(kontainer_knapp_plassering, innhold_mål, innhold_fjern){
        
        const tilbake_knapp = document.createElement("button")
        tilbake_knapp.id = "tilbake_knapp"
        tilbake_knapp.innerHTML = "Tilbake"
        
        tilbake_knapp.addEventListener("click", () =>{
            for (let i = 0; i < innhold_mål.length; i++) {
                kontainer_knapp_plassering.appendChild(innhold_mål[i])
            }
            for (let i = 0; i < innhold_fjern.length; i++) {
                innhold_fjern[i].replaceChildren() 
            }
            kontainer_knapp_plassering.removeChild(tilbake_knapp)
        })
        kontainer_knapp_plassering.appendChild(tilbake_knapp)
    }

    lag_innhold_kort(kontainer){
        //lager alle "cards" (kort på norsk?) som inneholder informajsonene om bilde til sangen, tittel, artist, og lyden
        for (let i = 0; i < this.sanger.length; i++) {
            //kontainer_spilleliste_innhold for all informasjonen til hver av sangene.
            const innhold_kort = document.createElement("div")  
            innhold_kort.classList.add('innhold_kort')
            kontainer.appendChild(innhold_kort);


            const artist_tittel = document.createElement("p1");
            artist_tittel.classList.add("album");
            artist_tittel.innerHTML = `${this.sanger[i].artist} - ${this.sanger[i].tittel}` ;
            
            const bilde = document.createElement("img")
            bilde.classList.add("img");
            bilde.src = `${this.path_spilleliste}/${this.sanger[i].bildefil}`
            bilde.addEventListener("click", () =>{
                this.sanger[i].spill_pause_sang()
            })

            const lyd = document.createElement('audio');
            lyd.classList.add('lyd')
            lyd.id = this.sanger[i].lydfil
            lyd.src = `${this.path_spilleliste}/${this.sanger[i].lydfil}`;
            lyd.autoplay = false;
            lyd.controls = true;      
            
            lyd.addEventListener("play", () => {
                if(!document.getElementById("bunn_bar")){
                    this.lag_bunn_bar(kontainer, this.sanger[this.nåværende_lydspor_id])
                }
                //Husker hvilke sanger som har blitt spilt av,
                //slik man skan hoppe tilbake til sangene man hørte på.
                if (this.spill_modus === 'tilfeldig' && this.gamle_sanger === false){
                    //om sangen som spilles av ikke er øverst i stacken til spilte_sanger_indexer, legges den til i stacken. (tror det er rett bruk av betegnelsen "stack")
                    if (this.spilte_sanger_indexer[this.spilte_sanger_indexer.length - 1] != this.nåværende_lydspor_id) {
                        this.spilte_sanger_indexer.push(this.nåværende_lydspor_id)
                        this.spilte_sanger_nåværende_index += 1
                    }
                }
                this.nåværende_lydspor_id = parseInt(this.sanger[i].id)
                this.reset_nesten_alle_sanger(this.nåværende_lydspor_id)
                this.sang_endret_bunn_bar(this.sanger[this.nåværende_lydspor_id])
                this.finn_tid_i_sang(this.sanger[this.nåværende_lydspor_id])
                this.endre_spill_pause_tilstand(this.spill_pause_lyd)
            });
            lyd.addEventListener("pause", () => {
                this.endre_spill_pause_tilstand(this.spill_pause_lyd)
            });

            lyd.addEventListener("ended", () => {
                //sang index øker naturligvis med 1, om spillmodus er tilfeldig er det irrelevant
                //deretter spilles sang med nye indexen
                this.nåværende_lydspor_id = parseInt(this.sanger[i].id) + 1
                this.spill_sang_spilleliste(this.nåværende_lydspor_id)
                this.sang_endret_bunn_bar(this.sanger[this.nåværende_lydspor_id])
            });
            
            innhold_kort.appendChild(artist_tittel);
            innhold_kort.appendChild(bilde);
            innhold_kort.appendChild(lyd);
        }
    }

    //lager en "bottom bar"
    lag_bunn_bar(kontainer, spor){
        
        const bunn_bar = document.createElement("div");
        bunn_bar.id = ("bunn_bar");
        kontainer.appendChild(bunn_bar);

        //sang_avspilling og progressbar
        const kontainer_sang_manipulasjon = document.createElement("div")
        kontainer_sang_manipulasjon.id = "kontainer_sang_manipulasjon"
        bunn_bar.appendChild(kontainer_sang_manipulasjon)

        //skip back, pause og skip
        const kontainer_sang_avspilling = document.createElement("div")
        kontainer_sang_avspilling.id = "kontainer_sang_avspilling"

        //Progress bar
        this.kontainer_sang_progresjonbar = document.createElement("div");
        this.kontainer_sang_progresjonbar.id = ("kontainer_sang_progresjonbar");

        kontainer_sang_manipulasjon.appendChild(kontainer_sang_avspilling)
        kontainer_sang_manipulasjon.appendChild(this.kontainer_sang_progresjonbar);

        this.lag_spor_informasjon(bunn_bar, spor)
        this.lag_spor_avspilling(kontainer_sang_avspilling, spor)        
        this.lag_progresjonsbar(this.kontainer_sang_progresjonbar, spor)
    }

    lag_spor_informasjon(kontainer, spor){

        const kontainer_sang_info = document.createElement("div")
        kontainer_sang_info.id = "bunn_bar_sang_info"
        kontainer.appendChild(kontainer_sang_info)

        this.spor_bilde = document.createElement("img")
        this.spor_bilde.id = "bunn_bar_spor_bilde"
        this.spor_bilde.src = `${this.path_spilleliste}/${spor.bildefil}`

        this.spor_artist_tittel = document.createElement("h1")
        this.spor_artist_tittel.id = "bunn_bar_spor_artist_titel"
        this.spor_artist_tittel.innerHTML =  `${spor.artist} - ${spor.tittel}`;
        
        kontainer_sang_info.appendChild(this.spor_bilde)
        kontainer_sang_info.appendChild(this.spor_artist_tittel)
    }

    lag_spor_avspilling(kontainer){

        //lager skip baklengs knapp m/bilde
        const skip_baklengs_sang_knapp = document.createElement("button")
        const skip_baklengs_sang_bilde = document.createElement("img");
        skip_baklengs_sang_bilde.src = "./bilder/previous_track_button.png"
        skip_baklengs_sang_bilde.id = ("skip_baklengs_sang_bilde");
        skip_baklengs_sang_knapp.appendChild(skip_baklengs_sang_bilde); 
        skip_baklengs_sang_knapp.addEventListener('click', () => {
            if (this.spill_modus === 'sekvensiell'){
                this.nåværende_lydspor_id -= 1
                this.spill_sang_spilleliste(this.nåværende_lydspor_id)
            }
            else if (this.spill_modus == 'tilfeldig'){
                //husker hvilke sanger som har blitt spilt og spiller av de tidligere sangene
                if (this.spilte_sanger_nåværende_index > 0){
                    this.gamle_sanger = true
                    this.spilte_sanger_nåværende_index -= 1
                    this.sanger[(this.spilte_sanger_indexer[this.spilte_sanger_nåværende_index])].spill_pause_sang()
                }
                //Første sang i "spilte sanger" arrayen, derfor resets bare tiden
                else{
                    this.sanger[(this.spilte_sanger_indexer[this.spilte_sanger_nåværende_index])].reset_tid()
                }
            }
        })

        //Lager spill/pause knappen
        this.spill_pause_lyd = document.createElement('button')
        this.spill_pause_lyd.id = 'spill_pause_knapp'
        this.spill_pause_lyd.classList.add('knapp_pauset')  
        this.spill_pause_lyd.addEventListener('click', () => { 
            this.sanger[this.nåværende_lydspor_id].spill_pause_sang() 
        })

        //lager skip knapp m/bilde
        const skip_sang_knapp = document.createElement("button")
        const skip_sang_bilde = document.createElement("img");
        skip_sang_bilde.src = "./bilder/next_track_button_larger.png"
        skip_sang_bilde.id = ("skip_sang_bilde");
        skip_sang_knapp.appendChild(skip_sang_bilde); 
        skip_sang_knapp.addEventListener('click', () => {
            if (this.spill_modus == 'sekvensiell'){
                this.nåværende_lydspor_id += 1
                this.spill_sang_spilleliste(this.nåværende_lydspor_id)
            }
            else if (this.spill_modus == 'tilfeldig'){
                //husker hvilke sanger som har blitt spilt og spiller av de neste sangene i en liste som husker hvilke sanger som har blitt avspilt
                if (this.spilte_sanger_nåværende_index < this.spilte_sanger_indexer.length - 1){
                    this.gamle_sanger = true
                    this.spilte_sanger_nåværende_index += 1
                    this.sanger[(this.spilte_sanger_indexer[this.spilte_sanger_nåværende_index])].spill_pause_sang()
                }
                //slutten av "spilte sanger" listen er nådd
                else{
                    this.gamle_sanger = false
                    this.spill_sang_spilleliste(this.nåværende_lydspor_id)
                }
            }
        })

        kontainer.appendChild(skip_baklengs_sang_knapp); 
        kontainer.appendChild(this.spill_pause_lyd);
        kontainer.appendChild(skip_sang_knapp); 
    }

    lag_progresjonsbar(kontainer, spor){

        const lyd_element = document.getElementById(spor.lydfil);

        this.sang_nåtid = document.createElement("p")
        this.sang_nåtid.innerHTML = "00:00"

        this.sang_progresjonbar = document.createElement("progress");
        this.sang_progresjonbar.id = ("sang_progresjonbar");

        this.sang_lengde = document.createElement("p")
        
        //laster inn lydelementet slik at lengden på lydfilen kan leses
        lyd_element.onloadedmetadata = () => {this.lag_tid(spor, this.sang_lengde, 'fremtid')};
        kontainer.appendChild(this.sang_nåtid); 
        kontainer.appendChild(this.sang_progresjonbar); 
        kontainer.appendChild(this.sang_lengde); 
    }

    finn_tid_i_sang(spor){
        const lyd_element = document.getElementById(spor.lydfil);
        if (this.sjekk_tid_id){
            clearInterval(this.sjekk_tid_id)
        }
        this.sjekk_tid_id = setInterval(() => {
            this.lag_tid(spor, this.sang_nåtid, 'nåværende')
            //finner hvor mye prosent sangen er ferdig (oppgitt i brøkdeler)
            this.sang_progresjonbar.value = ((100/lyd_element.duration)*lyd_element.currentTime)/100
        }, 250);
    }

    sang_endret_bunn_bar(spor){
        this.spor_bilde.src = `${this.path_spilleliste}/${spor.bildefil}`
        this.spor_artist_tittel.innerHTML =`${spor.artist} - ${spor.tittel}`;
        this.lag_tid(spor, this.sang_lengde, 'fremtid')
    }

    endre_spill_pause_tilstand(spill_pause_knapp){
        const lyd_element = document.getElementById(this.sanger[this.nåværende_lydspor_id].lydfil);

        if (lyd_element.paused){
            spill_pause_knapp.classList.remove('knapp_spiller')
            spill_pause_knapp.classList.add('knapp_pauset')
        }
        else{
            spill_pause_knapp.classList.remove('knapp_pauset')
            spill_pause_knapp.classList.add('knapp_spiller')
        }
    }

    lag_tid(spor, mål_element, tidsrom){

        const lyd_element = document.getElementById(spor.lydfil);
        
        if (tidsrom == 'nåværende'){
            var rest_timer = Math.floor(lyd_element.currentTime / 3600)
            var rest_minutter = Math.floor((lyd_element.currentTime / 60) % 60)
            var rest_sekunder = Math.floor(lyd_element.currentTime % 60)
        }
        else if (tidsrom == 'fremtid'){
            var rest_timer = Math.floor(lyd_element.duration / 3600)
            var rest_minutter = Math.floor((lyd_element.duration / 60) % 60)
            var rest_sekunder = Math.floor(lyd_element.duration % 60)
        }

        if (Math.floor(rest_minutter/10) == 0){
            rest_minutter = '0' + (rest_minutter).toString()
        }
        if (Math.floor(rest_sekunder/10) == 0){
            rest_sekunder = '0' + (rest_sekunder).toString()
        }

        if (rest_timer != 0){
            mål_element.innerHTML = rest_timer + ":" + rest_minutter + ":" + rest_sekunder
        }
        else{
            mål_element.innerHTML = rest_minutter + ":" + rest_sekunder
        }    
    }
}