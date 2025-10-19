import java.util.Scanner;
import java.sql.Date;
import java.time.LocalDate; //Permet la manipulation des date sans heures 
import java.time.format.DateTimeFormatter; //Permet de definir et d analyser les dates et les heures 
import java.time.format.DateTimeParseException; //Permet de gerer le exceptions liees au formatage de dates et les heures 


public class RythmCycle {


    public static void main(String[]args) {
        Scanner write =new Scanner(System.in);
        char Categorie= ' ';
        char Type=' ';

        do {
            MenuPrincipal();
            Categorie=write.next().charAt(0);

            if(Categorie !='1' && Categorie != '2'){
                System.out.println("Categorie non prise en charge.Veuiller entrer un choix dans le menu disponible...");
            }
            
        } while (Categorie !='1' && Categorie != '2');

        if (Categorie=='2') {
            System.out.println("Votre cycle est irregulier par consequent nous ne popuvons predire les differentes variations.Pour en savoir plusDays veuiller vous rendre dans un hopital...");
            System.exit(1);
        }else{
            do {
                CycleRegulier();
                Type=write.next().charAt(0);
                if (Type!='1' && Type !='2' && Type!='3') {
                  System.out.println("Choix non disponible...");  
                }
            } while (Type!='1' && Type !='2' && Type!='3');

            
        }
        Result(Type);
       
        
       
       
       



    }

    static void MenuPrincipal (){
        System.out.println("--------RythmCycle--------");
        System.out.println("  ");
        System.out.println("Le programme permet de determiner votre periode feconde, le jour approximatif  de la ponte et vous donne la date probable des prochaines regles");
        System.out.println("  ");
        System.out.println("Veuillez Choisir votre categorie de cycle : ");
         System.out.println("  ");
        System.out.println("1- CYCLE REGULIER ");
        System.out.println("2- CYCLE IRREGULIER");
    
    }
    static void CycleRegulier(){
        System.out.println("Veuiller choisir la duree de votre cycle :");
        System.out.println("  ");
        System.out.println(" 1- CYCLE COURT : 15 - 26 jours  ");
        System.out.println(" 2- CYCLE MOYEN : 28 jours ");
        System.out.println("3- CYCLE LONG :  30 - 60 jours  ");
    }
    static void Result(char Type){
        int dureeDuCycle=0;
        LocalDate DateParsed=LocalDate.now();//J initialise la date 
         Scanner write = new Scanner(System.in);

         System.out.println(" Veuiller entrer la date du premier jour ou vous avez vu vos regles ");
         String DateUser = write.nextLine();//je recupere la date entrer sous forme de chaine 

         switch (Type) {
            case '1':
            do {
                  System.out.println("Veuiller entrer le nombre de jours de votre cycle (15 - 26 jours) ");
                  dureeDuCycle= write.nextInt();
                  if (dureeDuCycle<15 && dureeDuCycle >26){
                    System.out.println("Le nombre de jours entrer ne correspond pas a votre type de cycle...");
                  }
            } while (dureeDuCycle<15 && dureeDuCycle >26);
              
                break;
          case '2':

                  dureeDuCycle = 28;
                

            break;
             case '3':
            do {
                  System.out.println("Veuiller entrer le nombre de jours de votre cycle (30 - 60 jours) ");
                  dureeDuCycle= write.nextInt();
                   if (dureeDuCycle<30 && dureeDuCycle >60){
                    System.out.println("Le nombre de jours entrer ne correspond pas a votre type de cycle...");
                  }
            } while (dureeDuCycle<30 && dureeDuCycle >60);
            break;

            default:
            System.out.println("Nombre de jours non pris en charge...");
                break;
         }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy"); //Cette fonction me permet de definir un date selon un formoat precis 
        DateTimeFormatter outpoutFormatter = DateTimeFormatter.ofPattern("EEEE dd MM yyyy",java.util.Locale.FRENCH);//Permet de definir un format de sorti
        //Cette ligne me permet d afficher en francais  le jour correspndant a la date entrer
         
         // Ici je verifie ce que l utilisateur a entrer comme date 
        try {
            DateParsed= LocalDate.parse(DateUser,formatter);
            System.out.println(" La date est : " + DateParsed.format(outpoutFormatter));

         } catch (DateTimeParseException e) {
             System.out.println("La date est invalide ...");
         }

        //Ici je m occupe des traitements calcul  de la periode feconde, la date probable des prochaines et le jour de la pnte ovulaire 
        LocalDate PonteOvulaire=LocalDate.now();
        LocalDate PeriodeFecondeA=LocalDate.now();
        LocalDate PeriodeFecondeB=LocalDate.now();
        LocalDate NewCycle= LocalDate.now();

          System.out.println("A partir des donnees receuillies on deduit que : ");
          System.out.println(" ");

  switch (Type) {
    case '1':
       PonteOvulaire= DateParsed.plusDays(dureeDuCycle-14);
         PeriodeFecondeA=PonteOvulaire.minusDays(5);
         PeriodeFecondeB=PonteOvulaire.plusDays(5);
         NewCycle=DateParsed.plusDays(dureeDuCycle+1);
        System.out.println("- La ponte ovulaire aura lieu :  " + PonteOvulaire.format(outpoutFormatter));
        System.out.println("- La periode feconde s etalera du  " + PeriodeFecondeA.format(outpoutFormatter)+" au "+PeriodeFecondeB.format(outpoutFormatter));
        System.out.println("- La date probable des prochaines regles est le : "+ NewCycle.format(outpoutFormatter));
        break;

        case '2':
       PonteOvulaire= DateParsed.plusDays(dureeDuCycle-14);
         PeriodeFecondeA=PonteOvulaire.minusDays(5);
         PeriodeFecondeB=PonteOvulaire.plusDays(5);
         NewCycle=DateParsed.plusDays(dureeDuCycle+1);
       System.out.println("- La ponte ovulaire aura lieu :  " + PonteOvulaire.format(outpoutFormatter));
        System.out.println("-La periode feconde s etalera du  " + PeriodeFecondeA.format(outpoutFormatter)+" au "+PeriodeFecondeB.format(outpoutFormatter));
        System.out.println("- La date probable des prochaines regles est le : "+ NewCycle.format(outpoutFormatter));
        break;
        case '3':
       PonteOvulaire= DateParsed.plusDays(dureeDuCycle-14);
         PeriodeFecondeA=PonteOvulaire.minusDays(5);
         PeriodeFecondeB=PonteOvulaire.plusDays(5);
         NewCycle=DateParsed.plusDays(dureeDuCycle+1);
        System.out.println("- La ponte ovulaire aura lieu :  " + PonteOvulaire.format(outpoutFormatter));
        System.out.println("- La periode feconde s etalera du  " + PeriodeFecondeA.format(outpoutFormatter)+" au "+PeriodeFecondeB.format(outpoutFormatter));
        System.out.println("- La date probable des prochaines regles est le : "+ NewCycle.format(outpoutFormatter));
        break;
    default:
    System.out.println("Affiche non disponible..");
        break;
}
 
    }


}
