import java.util.Scanner;

public class NumberGenarator {

     public static void main(String[] args) {
        //declaration des varriables 

        Scanner saisie = new Scanner(System.in);//Ca sert a recuperer les entrees clavier
        int UserNumber=0;//Ca sert a recuperer le nombre de l utilisateur
        int SecretNumber=(int)(Math.random()*21);//Cette ligne permet de generer un nombre aleatoire entre 0 et 20


        System.out.println("----------NumberGenerator--------");
        System.out.println("Le jeu consiste a deviner le nombre cacher entre 0 et 20");

        while (true) {
            System.out.println("Veuiller entrer un nombre entre 0 et 20");
            UserNumber= saisie.nextInt();
            // Lutilisateur entre le nombre 

            if (UserNumber==SecretNumber) {
                System.out.println("Vous avez reussi");
                break;
            } else if (UserNumber<SecretNumber) {
                System.out.println("Trop bas ,reesayez");
            } else {
                System.out.println("Trop haut , reesayez");
            } {
                
            }
        }
        saisie=close();
     }
}